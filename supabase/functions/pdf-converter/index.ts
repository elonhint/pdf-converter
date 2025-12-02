import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const format = formData.get("format") as string;

    if (!file || !format) {
      return new Response(
        JSON.stringify({ success: false, message: "File and format are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    const conversionData = {
      tasks: {
        import: {
          operation: "import/base64",
          file: base64,
          filename: file.name,
        },
        convert: {
          operation: `convert`,
          input: "import",
          output_format: format,
          engine: "office",
        },
        export: {
          operation: "export/base64",
          input: "convert",
        },
      },
    };

    const apiKey = Deno.env.get("CLOUDCONVERT_API_KEY");
    if (!apiKey) {
      console.error("CloudConvert API key not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Conversion service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(conversionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("CloudConvert error:", errorData);
      return new Response(
        JSON.stringify({ success: false, message: "Conversion failed", error: errorData }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const jobId = result.data.id;

    let jobStatus = result.data;
    let attempts = 0;
    const maxAttempts = 60;

    while (jobStatus.status !== "finished" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        jobStatus = statusData.data;
      }

      attempts++;
    }

    if (jobStatus.status !== "finished") {
      return new Response(
        JSON.stringify({ success: false, message: "Conversion timeout" }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const exportTask = jobStatus.tasks.find(
      (task: { name: string }) => task.name === "export"
    );

    if (!exportTask || !exportTask.result || !exportTask.result.files.length) {
      return new Response(
        JSON.stringify({ success: false, message: "No converted file found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const convertedFile = exportTask.result.files[0];

    const fileResponse = await fetch(convertedFile.url);
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    return new Response(
      JSON.stringify({
        success: true,
        message: `PDF converted to ${format.toUpperCase()} successfully!`,
        file: fileBase64,
        filename: `${file.name.replace(".pdf", "")}.${format}`,
        mimeType: getMimeType(format),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "An error occurred during conversion",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    rtf: "application/rtf",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    jfif: "image/jpeg",
    png: "image/png",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
  };
  return mimeTypes[format] || "application/octet-stream";
}