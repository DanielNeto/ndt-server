#!/bin/bash

set -euxo pipefail

openssl genrsa -out wildcard_medidor.rnp.br.key
openssl req -new -x509 -key wildcard_medidor.rnp.br.key -out wildcard_medidor.rnp.br.cer -days 2 -subj "/C=XX/ST=State/L=Locality/O=Org/OU=Unit/CN=localhost/emailAddress=test@email.address"
mv wildcard_medidor.rnp.br.key wildcard_medidor.rnp.br.cer certs/
