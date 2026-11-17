#!/bin/sh
set -eu

# O entrypoint da imagem fornece o endereço temporário em INFLUX_HOST.
influx write --org "$DOCKER_INFLUXDB_INIT_ORG" \
  --bucket "$DOCKER_INFLUXDB_INIT_BUCKET" \
  --precision s --file /seed/measurements.lp
