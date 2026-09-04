// Minimal Resend client compatible with the API surface used by the ported
// Konektum functions (`new Resend(key).emails.send({...})`).
const ENDPOINT = "https://api.resend.com/emails";

export class Resend {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  emails = {
    send: async (payload: Record<string, unknown>) => {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
      if (!res.ok) {
        return { data: null, error: { message: typeof data === "string" ? data : JSON.stringify(data), statusCode: res.status } };
      }
      return { data, error: null };
    },
  };
}

export default Resend;
