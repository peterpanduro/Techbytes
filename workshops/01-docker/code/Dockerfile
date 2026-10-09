# Stage 1: build, in an image that has the Go toolchain (about 800 MB)
FROM golang:1.27 AS build
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server .

# Stage 2: run, in an image that has nothing at all
FROM scratch
WORKDIR /data
COPY --from=build /app/server /server
EXPOSE 8080
CMD ["/server"]
