async function analyze() {
  const fileInput = document.getElementById('fileInput');
  if (!fileInput.files.length) return alert("Please upload a PDF document.");

  const file = fileInput.files[0];

  const apiKey = "9d5c8380-0ebe-4d09-8983-fb785d9d2ab8";
  const endpoint = "https://kaliii.cognitiveservices.azure.com";
  const modelId = "Medtech"; // <-- replace this with your real model ID

  const url = `${endpoint}/formrecognizer/documentModels/${modelId}:analyze?api-version=2023-07-31`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/pdf',
    },
    body: file
  });

  const resultUrl = response.headers.get('operation-location');
  let result;

  while (true) {
    const poll = await fetch(resultUrl, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey }
    });
    result = await poll.json();

    if (result.status === 'succeeded') break;
    else if (result.status === 'failed') return alert("Analysis failed.");

    await new Promise(res => setTimeout(res, 1000));
  }

  compareFields(result.documents[0].fields);
}

function compareFields(fields) {
  const pairs = [
    { label: "Patient Name", rx: "Rx PT Name", de: "DE PT Name" },
    { label: "DOB", rx: "Rx PT DOB", de: "DE PT DOB" },
    { label: "Drug", rx: "Rx Drug", de: "DE Drug" },
    // Add more fields as needed
  ];

  let html = `<table><tr><th>Field</th><th>Rx</th><th>DE</th><th>Status</th></tr>`;

  for (const field of pairs) {
    const rx = fields[field.rx]?.content || "";
    const de = fields[field.de]?.content || "";
    const match = rx.trim() === de.trim();
    html += `<tr class="${match ? 'match' : 'mismatch'}">
      <td>${field.label}</td>
      <td>${rx}</td>
      <td>${de}</td>
      <td>${match ? "✔️ Match" : "❌ Mismatch"}</td>
    </tr>`;
  }

  html += `</table>`;
  document.getElementById('output').innerHTML = html;
}
