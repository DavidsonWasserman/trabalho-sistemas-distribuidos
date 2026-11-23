from(bucket: "horticultura")
    |> range(start: 0)
    |> filter(fn: (r) => r._measurement == "measurements")
    |> filter(fn: (r) =>
        r._field == "temperature" or r._field == "humidity" or
        r._field == "pressure" or r._field == "rssi"
    )
    |> last()
