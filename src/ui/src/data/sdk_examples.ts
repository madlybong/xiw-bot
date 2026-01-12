export const clientLibraries = {
    node: `class XiWBotClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async _request(endpoint, body) {
    const res = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.token}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return await res.json();
  }

  sendText(instanceId, to, message) {
    return this._request(\`/api/wa/send/text/\${instanceId}\`, { to, message });
  }

  sendImage(instanceId, to, url, caption = "") {
    return this._request(\`/api/wa/send/image/\${instanceId}\`, { to, url, caption });
  }

  sendVideo(instanceId, to, url, caption = "", gifPlayback = false) {
    return this._request(\`/api/wa/send/video/\${instanceId}\`, { to, url, caption, gifPlayback });
  }

  sendAudio(instanceId, to, url, ptt = true) {
    return this._request(\`/api/wa/send/audio/\${instanceId}\`, { to, url, ptt });
  }

  sendDocument(instanceId, to, url, filename) {
    return this._request(\`/api/wa/send/document/\${instanceId}\`, { to, url, filename });
  }

  sendLocation(instanceId, to, latitude, longitude, address = "") {
    return this._request(\`/api/wa/send/location/\${instanceId}\`, { to, latitude, longitude, address });
  }

  sendTemplate(instanceId, to, templateName, variables = []) {
    return this._request(\`/api/wa/send/template/\${instanceId}\`, { to, templateName, variables });
  }
}

// Usage
const bot = new XiWBotClient("http://localhost:3000", "YOUR_API_TOKEN");
await bot.sendText(1, "1234567890", "Hello World!");
`,

    php: `class XiWBotClient {
    private $baseUrl;
    private $token;

    public function __construct($baseUrl, $token) {
        $this->baseUrl = $baseUrl;
        $this->token = $token;
    }

    private function request($endpoint, $data) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $this->token,
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    public function sendText($instanceId, $to, $message) {
        return $this->request("/api/wa/send/text/$instanceId", ["to" => $to, "message" => $message]);
    }

    public function sendImage($instanceId, $to, $url, $caption = "") {
        return $this->request("/api/wa/send/image/$instanceId", ["to" => $to, "url" => $url, "caption" => $caption]);
    }

    public function sendVideo($instanceId, $to, $url, $caption = "", $gifPlayback = false) {
        return $this->request("/api/wa/send/video/$instanceId", ["to" => $to, "url" => $url, "caption" => $caption, "gifPlayback" => $gifPlayback]);
    }

    public function sendAudio($instanceId, $to, $url, $ptt = true) {
        return $this->request("/api/wa/send/audio/$instanceId", ["to" => $to, "url" => $url, "ptt" => $ptt]);
    }

    public function sendDocument($instanceId, $to, $url, $filename) {
        return $this->request("/api/wa/send/document/$instanceId", ["to" => $to, "url" => $url, "filename" => $filename]);
    }

    public function sendLocation($instanceId, $to, $latitude, $longitude, $address = "") {
        return $this->request("/api/wa/send/location/$instanceId", ["to" => $to, "latitude" => $latitude, "longitude" => $longitude, "address" => $address]);
    }

    public function sendTemplate($instanceId, $to, $templateName, $variables = []) {
        return $this->request("/api/wa/send/template/$instanceId", ["to" => $to, "templateName" => $templateName, "variables" => $variables]);
    }
}

// Usage
$bot = new XiWBotClient("http://localhost:3000", "YOUR_API_TOKEN");
$bot->sendText(1, "1234567890", "Hello from PHP");
`,

    vb: `Imports System.Net.Http
Imports System.Text
Imports System.Text.Json ' NuGet Package: System.Text.Json

Public Class XiWBotClient
    Private ReadOnly _client As HttpClient
    Private ReadOnly _baseUrl As String

    Public Sub New(baseUrl As String, token As String)
        _baseUrl = baseUrl
        _client = New HttpClient()
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer " & token)
    End Sub

    Private Async Function SendAsync(endpoint As String, data As Object) As Task(Of String)
        Dim json = JsonSerializer.Serialize(data)
        Dim content = New StringContent(json, Encoding.UTF8, "application/json")
        Dim response = Await _client.PostAsync(_baseUrl & endpoint, content)
        Return Await response.Content.ReadAsStringAsync()
    End Function

    Public Async Function SendText(instanceId As Integer, postTo As String, message As String) As Task(Of String)
        Return Await SendAsync($"/api/wa/send/text/{instanceId}", New With {.to = postTo, .message = message})
    End Function

    Public Async Function SendImage(instanceId As Integer, postTo As String, url As String, caption As String) As Task(Of String)
        Return Await SendAsync($"/api/wa/send/image/{instanceId}", New With {.to = postTo, .url = url, .caption = caption})
    End Function

    Public Async Function SendVideo(instanceId As Integer, postTo As String, url As String, caption As String, gifPlayback As Boolean) As Task(Of String)
        Return Await SendAsync($"/api/wa/send/video/{instanceId}", New With {.to = postTo, .url = url, .caption = caption, .gifPlayback = gifPlayback})
    End Function

    Public Async Function SendAudio(instanceId As Integer, postTo As String, url As String, ptt As Boolean) As Task(Of String)
        Return Await SendAsync($"/api/wa/send/audio/{instanceId}", New With {.to = postTo, .url = url, .ptt = ptt})
    End Function

    Public Async Function SendDocument(instanceId As Integer, postTo As String, url As String, filename As String) As Task(Of String)
        Return Await SendAsync($"/api/wa/send/document/{instanceId}", New With {.to = postTo, .url = url, .filename = filename})
    End Function

    Public Async Function SendLocation(instanceId As Integer, postTo As String, latitude As Double, longitude As Double, address As String) As Task(Of String)
        Return Await SendAsync($"/api/wa/send/location/{instanceId}", New With {.to = postTo, .latitude = latitude, .longitude = longitude, .address = address})
    End Function

    Public Async Function SendTemplate(instanceId As Integer, postTo As String, templateName As String, variables As String()) As Task(Of String)
        Return Await SendAsync($"/api/wa/send/template/{instanceId}", New With {.to = postTo, .templateName = templateName, .variables = variables})
    End Function
End Class

' Usage
' Dim bot As New XiWBotClient("http://localhost:3000", "YOUR_TOKEN")
' Await bot.SendText(1, "1234567890", "Hello from VB.NET")
`
};
