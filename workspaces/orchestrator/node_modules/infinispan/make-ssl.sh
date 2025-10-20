#!/bin/bash

set -e -x

ROOT="out"
PASS="secret"

#CA_ALIAS="infinispan-ca"
#CA_DIR=${ROOT}/ssl/ca
#CA_KEYSTORE="ca.jks"

# Remove any previous certificate
rm -drf ${ROOT}/ssl


# Create keystore
create_keystore() {
   local alias=$1
   local dname=$2
   local dir=$3
   local keystore=$4

   keytool -genkeypair \
      -alias $alias \
      -dname $dname \
      -keystore $dir/$keystore \
      -storepass $PASS \
      -keypass $PASS \
      -keyalg RSA \
      -keysize 2048 \
      -storetype JKS
}


# Create certificate sign request
create_sign_request() {
   local alias=$1
   local dname=$2
   local dir=$3
   local keystore=$4
   local csr=$5

   keytool -certreq \
      -alias $alias \
      -dname $dname \
      -keystore $dir/$keystore \
      -storepass $PASS \
      -keypass $PASS \
      -file $dir/$csr
}


# Sign certificate with CA
sign_certificate() {
   local ca=$1
   local dir=$2
   local csr=$3
   local cer=$4

   local ca_alias="infinispan-$ca"
   local ca_dir=${ROOT}/ssl/$ca
   local ca_keystore="$ca.jks"

   keytool -gencert \
      -alias $ca_alias \
      -keystore $ca_dir/$ca_keystore \
      -storepass $PASS \
      -keypass $PASS \
      -infile $dir/$csr \
      -outfile $dir/$cer
}


# Import CA keystore into keystore
import_ca() {
   local ca=$1
   local dir=$2
   local keystore=$3

   local ca_alias="infinispan-$ca"
   local ca_dir=${ROOT}/ssl/$ca
   local ca_keystore="$ca.jks"

   keytool -importkeystore \
      -srcalias $ca_alias \
      -srcstorepass $PASS \
      -srckeystore $ca_dir/$ca_keystore \
      -deststorepass $PASS \
      -destkeystore $dir/$keystore
}


# Import certificate into keystore
import_certificate() {
   local alias=$1
   local dir=$2
   local keystore=$3
   local cer=$4

   keytool -importcert \
      -alias $alias \
      -keystore $dir/$keystore \
      -storepass $PASS \
      -keypass $PASS \
      -file $dir/$cer
}


# Convert into a p12 keystore
keystore_to_p12() {
   local dir=$1
   local keystore=$2
   local p12store=$3

   keytool -importkeystore \
      -srckeystore $dir/$keystore \
      -destkeystore $dir/$p12store \
      -srcstoretype jks \
      -deststoretype pkcs12 \
      -srcstorepass $PASS \
      -deststorepass $PASS
}


# Extract client certificate as pem
extract_pem_certificate() {
   local dir=$1
   local p12store=$2
   local pem=$3

   openssl pkcs12 \
      -in $dir/$p12store \
      -passin pass:$PASS \
      -passout pass:$PASS \
      -nokeys \
      -clcerts \
      | awk '/-BEGIN CERTIFICATE-/{a=1};a;/-END CERTIFICATE-/{exit}' \
      > $dir/$pem
}


make_ca() {
   local name=$1
   local dir=${ROOT}/ssl/$name
   local alias="infinispan-$name"
   local dname="CN=CA,OU=Infinispan,O=JBoss,L=RedHat"
   local keystore="$name.jks"
   local p12store="$name.p12"
   local pem="$name.pem"
   local pass="secret"

   # Make directories to work from
   mkdir -p $dir

   # Create your very own Root Certificate Authority
   keytool -genkeypair \
      -alias $alias \
      -dname $dname \
      -keystore $dir/$keystore \
      -storepass $pass \
      -keypass $PASS \
      -keyalg RSA \
      -keysize 2048 \
      -storetype JKS \
      -ext bc:c

   # Convert into a p12 keystore
   keytool -importkeystore \
      -srckeystore $dir/$keystore \
      -destkeystore $dir/$p12store \
      -srcstoretype jks \
      -deststoretype pkcs12 \
      -srcstorepass $pass \
      -deststorepass $pass

   # Extract pem
   openssl pkcs12 \
      -in $dir/$p12store \
      -out $dir/$pem \
      -passin pass:$pass \
      -passout pass:$pass \
      -nokeys
}


make_server_keystore() {
   local ca=$1
   local dir=${ROOT}/ssl/server
   local alias="server"

   # CN has to match Hostname/IP, otherwise you get:
   # Hostname/IP doesn't match certificate's altnames: "Host: localhost. is not cert's CN: Server"
   local dname="CN=localhost,OU=Infinispan,O=JBoss,L=RedHat"

   local keystore="server.jks"
   local p12store="server.p12"
   local csr="server.csr"
   local pass="secret"
   local cer="server.cer"

   local ca_dir=${ROOT}/ssl/$ca # TODO global
   local ca_keystore="$ca.jks" # TODO global
   local ca_alias="infinispan-$ca" # TODO global

   # Make directories to work from
   mkdir -p $dir

   # Create server keystore
   create_keystore $alias $dname $dir $keystore

   # Create certificate sign request
   keytool -certreq \
      -alias $alias \
      -dname $dname \
      -keystore $dir/$keystore \
      -storepass $pass \
      -keypass $PASS \
      -file $dir/$csr \

   # Sign certicate with CA
   keytool -gencert \
      -alias $ca_alias \
      -keystore $ca_dir/$ca_keystore \
      -storepass $pass \
      -keypass $PASS \
      -infile $dir/$csr \
      -outfile $dir/$cer

   # Import CA keystore into server keystore
   keytool -importkeystore \
      -srcalias $ca_alias \
      -srcstorepass $pass \
      -srckeystore $ca_dir/$ca_keystore \
      -deststorepass $pass \
      -destkeystore $dir/$keystore

   # Import server certificate into server keystore
   keytool -importcert \
      -alias $alias \
      -keystore $dir/$keystore \
      -storepass $pass \
      -keypass $PASS \
      -file $dir/$cer

   # Convert into a p12 keystore
   keytool -importkeystore \
      -srckeystore $dir/$keystore \
      -destkeystore $dir/$p12store \
      -srcstoretype jks \
      -deststoretype pkcs12 \
      -srcstorepass $pass \
      -deststorepass $pass
}


make_client_keystore() {
   local ca=$1
   local dir=${ROOT}/ssl/client
   local alias="client"

   # CN has to match Hostname/IP, otherwise you get:
   # Hostname/IP doesn't match certificate's altnames: "Host: localhost. is not cert's CN: Server"
   local dname="CN=localhost,OU=Infinispan,O=JBoss,L=RedHat"

   local keystore="client.jks"
   local p12store="client.p12"
   local pass="secret"
   local csr="client.csr"
   local cer="client.cer"
   local pem="client.pem"
   local privkey="client.pk"

   # Make directories to work from
   mkdir -p $dir

   create_keystore $alias $dname $dir $keystore
   create_sign_request $alias $dname $dir $keystore $csr
   sign_certificate $ca $dir $csr $cer
   import_ca $ca $dir $keystore
   import_certificate $alias $dir $keystore $cer
   keystore_to_p12 $dir $keystore $p12store
   extract_pem_certificate $dir $p12store $pem

   # Extract client private key as pem
   openssl pkcs12 \
      -in $dir/$p12store \
      -passin pass:$pass \
      -passout pass:$pass \
      -nocerts \
      -nodes \
      | awk '/-BEGIN PRIVATE KEY-/{a=1};a;/-END PRIVATE KEY-/{exit}' \
      > $dir/$privkey
}


make_sni() {
   local ca=$1
   local host=$2
   local dir=${ROOT}/ssl/sni-$host
   local alias=$host

   # CN has to match Hostname/IP
   local dname="CN=$host,OU=Infinispan,O=JBoss,L=RedHat"

   local keystore="$host.jks"
   local p12store="$host.p12"
   local csr="$host.csr"
   local cer="$host.cer"
   local pem="$host.pem"

   # Make directories to work from
   mkdir -p $dir

   create_keystore $alias $dname $dir $keystore
   create_sign_request $alias $dname $dir $keystore $csr
   sign_certificate $ca $dir $csr $cer
   import_ca $ca $dir $keystore
   import_certificate $alias $dir $keystore $cer
   keystore_to_p12 $dir $keystore $p12store
   extract_pem_certificate $dir $p12store $pem
}


main() {
   make_ca ca
   make_server_keystore ca
   make_client_keystore ca
   make_sni ca trust1
   make_sni ca trust2
   make_ca untrust-ca
   make_sni untrust-ca untrust
}


main
