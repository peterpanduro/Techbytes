# Deno ships its own image; the runtime stays in, so this is one stage.
FROM denoland/deno:2.9.7
WORKDIR /app
COPY totp.ts server.ts ./
RUN deno cache server.ts
EXPOSE 8000
CMD ["deno", "run", "--allow-net=0.0.0.0:8000", "server.ts"]
