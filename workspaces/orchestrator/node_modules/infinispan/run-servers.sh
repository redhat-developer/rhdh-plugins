#!/usr/bin/env bash

set -e

if [[ $1 = "--ci" ]]; then
  echo "Launch script finished"
else
  trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_VERSION="${SERVER_VERSION:-"14.0.27.Final"}"
SERVER_HOME=${SCRIPT_DIR}/server/original-server
SERVER_ZIP=${SCRIPT_DIR}/server/${SERVER_VERSION}.zip
CLUSTER_SIZE_MAIN="$SERVER_HOME/bin/cli.sh -c http://admin:pass@localhost:11322 -f batch "
ZIP_ROOT="http://downloads.jboss.org/infinispan"
DOWNLOAD_URL="${DOWNLOAD_URL:-"$ZIP_ROOT/$SERVER_VERSION/infinispan-server-$SERVER_VERSION.zip"}"

CONF_DIR_TO_COPY_FROM="spec/configs/"
IS_SSL_PROCESSED=0
SERVER_DIR="infinispan-server"

function waitForClusters()
{
cat > batch<<EOF
describe
disconnect
EOF

  MEMBERS_MAIN=''
  while [ "$MEMBERS_MAIN" != '3' ];
  do
    echo $CLUSTER_SIZE_MAIN
    MEMBERS_MAIN=$($CLUSTER_SIZE_MAIN | grep cluster_size | cut -d':' -f2 | sed 's/.$//' | sed -e 's/^[[:space:]]*//')
    echo "Waiting for clusters to form (main: $MEMBERS_MAIN)"
    sleep 20
  done
}

function prepareServerDir()
{
    local isCi=$1
    local confPath=$2
    local isSsl=$3
    local dirName=${4}

    echo ${isSsl}
    if [ ! -f "${SERVER_ZIP}" ]; then
        cd server
        wget "${DOWNLOAD_URL}" -O "${SERVER_ZIP}" --no-check-certificate
        unzip  "${SERVER_ZIP}"

        if [[ ${DOWNLOAD_URL} == *"redhat-datagrid"* ]]; then
          datagrid=$(cd "${SCRIPT_DIR}"/server/redhat-datagrid-*/; pwd)
          mv "$datagrid" "${SERVER_HOME}"
        else
          datagrid=$(cd "${SCRIPT_DIR}"/server/infinispan-server-*/; pwd)
          mv "$datagrid" "${SERVER_HOME}"
        fi
        cd ..
    fi

    if [[ -z "${SERVER_TMP}" ]]; then
         SERVER_TMP=server/${SERVER_DIR}
         mkdir ${SERVER_TMP} 2>/dev/null
         echo "Created temporary directory: $SERVER_TMP"

         cp -r ${SERVER_HOME}/* $SERVER_TMP
         echo "Server copied to temporary directory."

         $SERVER_TMP/bin/cli.sh user create admin -p pass
         echo "Admin user added."
    fi

    cp -r ${SERVER_HOME}/server ${SERVER_TMP}/${dirName}
    cp "${SERVER_TMP}/server/conf/users.properties" "${SERVER_TMP}/${dirName}/conf/users.properties"
    cp "${CONF_DIR_TO_COPY_FROM}/${confPath}" ${SERVER_TMP}/${dirName}/conf
    echo ${SERVER_TMP}

    echo "Infinispan configuration file ${confPath} copied to server ${dirName}."

    #Installing nashorn engine before server startup
    # If java > 15
    if [ $(javap -verbose java.lang.String | grep "major version" | cut -d " " -f5) -ge 60 ];  then
        mkdir -p ${SERVER_TMP}/${dirName}/lib
        ${SERVER_TMP}/bin/cli.sh install org.openjdk.nashorn:nashorn-core:15.4 --server-root=${dirName}
        ${SERVER_TMP}/bin/cli.sh install org.ow2.asm:asm:9.4  --server-root=${dirName}
        ${SERVER_TMP}/bin/cli.sh install org.ow2.asm:asm-commons:9.4  --server-root=${dirName}
        ${SERVER_TMP}/bin/cli.sh install org.ow2.asm:asm-tree:9.4  --server-root=${dirName}
        ${SERVER_TMP}/bin/cli.sh install org.ow2.asm:asm-util:9.4  --server-root=${dirName}
        echo Nashorn script engine installed for ${dirName}
    fi

    if [[ ${isSsl} = "true" && ${IS_SSL_PROCESSED} = 0 ]]; then
        ./make-ssl.sh
        echo "Generate TLS/SSL certificates"

        IS_SSL_PROCESSED=1
    fi

    if [[ ${isSsl} = "true" ]]; then
        cp out/ssl/ca/ca.p12 $SERVER_TMP/${dirName}/conf
        cp out/ssl/server/server.p12 $SERVER_TMP/${dirName}/conf
        cp out/ssl/client/client.p12 $SERVER_TMP/${dirName}/conf
        cp out/ssl/sni-trust1/trust1.p12 $SERVER_TMP/${dirName}/conf
        cp out/ssl/sni-trust2/trust2.p12 $SERVER_TMP/${dirName}/conf
        cp out/ssl/sni-untrust/untrust.p12 $SERVER_TMP/${dirName}/conf
        echo "Security key and trust stores copied to temporary server."
    fi
    export SERVER_TMP=${SERVER_TMP}
}

function startServer()
{
    local isCi=$1
    local confPath=$2
    local isSsl=$3
    local port=${4}
    local nodeName=${5}
    local jvmParam=${6}

    prepareServerDir "${isCi}" ${confPath} ${isSsl} ${nodeName}

    if [[ ! -z ${port} ]]; then
        portStr="-p ${port}"
    fi

    echo 'Cleaning data dir in '$SERVER_TMP''
    rm -rf $SERVER_TMP/data/*
    echo 'Run server '$nodeName' in '$SERVER_TMP''

    if [[ ${isCi} = "--ci" ]]; then
      nohup $SERVER_TMP/bin/server.sh -Djavax.net.debug -Dorg.infinispan.openssl=false -c ${confPath} -s ${SERVER_TMP}/${nodeName} ${portStr:-""}  --node-name=${nodeName} ${jvmParam:-} -Djgroups.bind.address=127.0.0.1 &
    else
      ${SERVER_TMP}/bin/server.sh -Djavax.net.debug -Dorg.infinispan.openssl=false -c ${confPath} -s ${SERVER_TMP}/${nodeName} ${portStr:-} --node-name=${nodeName} ${jvmParam:-} &
    fi
}

#deleting the testable server directory
rm -drf server/${SERVER_DIR}

export JAVA_OPTS="-Xms1024m -Xmx2048m -XX:MetaspaceSize=254M -XX:MaxMetaspaceSize=1024m"

startServer "$1" infinispan.xml false 11222 "server-local"
startServer "$1" infinispan-clustered.xml false 11322 "server-one"
startServer "$1" infinispan-clustered.xml false 11332 "server-two"
startServer "$1" infinispan-clustered.xml false 11342 "server-three"
startServer "$1" infinispan-ssl.xml true 11622 "server-ssl"

#Preparing server dirs for failover tests (3 servers)
prepareServerDir "$1" infinispan-clustered.xml false "server-failover-one"
prepareServerDir "$1" infinispan-clustered.xml false "server-failover-two"
prepareServerDir "$1" infinispan-clustered.xml false "server-failover-three"

#Preparing server dirs for xsite tests (2 servers)
prepareServerDir "$1" infinispan-xsite-EARTH.xml false "server-earth"
prepareServerDir "$1" infinispan-xsite-MOON.xml false "server-moon"

waitForClusters
echo "Infinispan test servers started."


if [[ $1 = "--ci" ]]; then
  echo "Launch script finished"
else
  # Wait until script stopped
  while :
  do
    sleep 5
  done
fi
