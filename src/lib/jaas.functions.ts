import { createServerFn } from "@tanstack/react-start";
import { SignJWT, importPKCS8 } from "jose";

type TokenInput = {
  room: string;
  name?: string;
  email?: string;
  avatar?: string;
  moderator?: boolean;
};

function validate(input: unknown): TokenInput {
  const i = (input ?? {}) as Partial<TokenInput>;
  if (typeof i.room !== "string" || !i.room.trim()) {
    throw new Error("Invalid room");
  }
  return {
    room: i.room,
    name: typeof i.name === "string" ? i.name : undefined,
    email: typeof i.email === "string" ? i.email : undefined,
    avatar: typeof i.avatar === "string" ? i.avatar : undefined,
    moderator: i.moderator === true,
  };
}

export const getJaasToken = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const appId = process.env.JAAS_APP_ID;
    const kid = process.env.JAAS_KID;
    const privateKeyRaw = process.env.JAAS_PRIVATE_KEY;
    if (!appId || !kid || !privateKeyRaw) {
      throw new Error("JaaS não configurado (falta App ID, Key ID ou chave privada).");
    }

    // Support keys stored with literal \n escapes.
    const pkcs8 = privateKeyRaw.includes("\\n")
      ? privateKeyRaw.replace(/\\n/g, "\n")
      : privateKeyRaw;
    const privateKey = await importPKCS8(pkcs8, "RS256");

    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
      aud: "jitsi",
      iss: "chat",
      sub: appId,
      room: "*",
      context: {
        user: {
          name: data.name || "Convidado",
          email: data.email || "",
          avatar: data.avatar || "",
          moderator: data.moderator === true,
          "hidden-from-recorder": false,
        },
        features: {
          livestreaming: true,
          recording: true,
          transcription: true,
          "outbound-call": true,
        },
      },
    })
      .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
      .setIssuedAt(now - 10)
      .setNotBefore(now - 10)
      .setExpirationTime(now + 60 * 60 * 3)
      .sign(privateKey);

    return { token, appId };
  });