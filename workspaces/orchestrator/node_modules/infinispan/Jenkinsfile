#!/usr/bin/env groovy

pipeline {
    agent {
        label 'slave-group-normal'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {
        stage('Build') {
            steps {
                nodejs(nodeJSInstallationName: 'Node 14') {
                    sh 'rm -drf node_modules/'
                    sh 'npm config ls'
                    sh 'npm install'
                }
            }
        }
        stage('Docs') {
            steps {
                nodejs(nodeJSInstallationName: 'Node 14') {
                    sh './node_modules/.bin/jsdoc lib/*.js'
                }
            }
        }
        stage('Run server') {
            steps {
                sh './run-servers.sh --ci'
            }
        }
        stage('Test') {
            steps {
                sh 'rm -drf tmp-tests.log'

                nodejs(nodeJSInstallationName: 'Node 14') {
                    sh './node_modules/.bin/jasmine-node spec --captureExceptions --forceexit'
                }
            }
        }
    }
    post {
        failure {
            sh 'cat tmp-tests.log'
            sh 'cat server/infinispan-server/server-*/log/server.log'
        }
    }
}
