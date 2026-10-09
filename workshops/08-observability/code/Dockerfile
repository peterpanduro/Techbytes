FROM golang:1.27 AS build
WORKDIR /app
COPY go.mod ./
COPY *.go ./
RUN CGO_ENABLED=0 go build -o server .

FROM scratch
COPY --from=build /app/server /server
CMD ["/server"]
