#!/usr/bin/env groovy

def lintStages(buildData, params) {
    if (buildData.isPrJob) {
        stage('commitlint') {
            if (params.RUN_LINT) {
                sh 'yarn commitlint --from=origin/$CHANGE_TARGET'
            }
        }
    }
    stage('eslint') {
        if (params.RUN_LINT) {
            sh 'yarn lint'
        }
    }
}

def unitTestsStage(buildData, params) {
    stage('unit tests') {
        if (params.RUN_UNIT_TESTS) {
            sh '''
                yarn test
            '''
        }
    }
}

def buildJsStage(buildData, params, env) {
    stage('build') {
        if (!buildData.isPrJob && params.PUBLISH_A_RELEASE) {
            withVaultEnv([["npm/confluent_npm", "token", "NPM_TOKEN"],
                ["github/confluent_jenkins", "access_token", "GH_TOKEN"]]) {
                sh "echo '//registry.npmjs.org/:_authToken=${env.NPM_TOKEN}' >> \$HOME/.npmrc"
                sh "yarn release --force-publish --create-release=github --yes"
            }
        }
    }
}
 
node('docker-debian-10-node') {

    def buildData = [
        buildStatus: 'Failure',
        buildJsStatus: 'Pending',
        isMasterBranch: env.BRANCH_NAME == 'master',
        isPrJob: !(env.JOB_NAME.startsWith('confluentinc/') || env.JOB_NAME.startsWith('confluentinc-post/')),
        revision: '',
    ]

    properties([
        buildDiscarder(
            logRotator(
                artifactDaysToKeepStr: '',
                artifactNumToKeepStr: '',
                daysToKeepStr: '7',
                numToKeepStr: ''
            )
        ),
        parameters([
            booleanParam(name: 'RUN_LINT',
                          defaultValue: true,
                          description: "Turn the lint stage on"),

            booleanParam(name: 'RUN_UNIT_TESTS',
                          defaultValue: true,
                          description: "Turn the unit tests stage on"),

            booleanParam(name: 'PUBLISH_A_RELEASE',
                          defaultValue: false,
                          description: "${env.BRANCH_NAME} branch only - publishes a release, generates a git tag and updates the changelogs"),


      ])
    ])

    try {
        stage('checkout') {
            echo sh(returnStdout: true, script: 'env')

            if (!buildData.isPrJob && params.PUBLISH_A_RELEASE) {
                slackNotify(
                    status: 'Started',
                    channel: '#ksql-fe',
                    always: true
                )

                checkout scm: [
                    $class: 'GitSCM',
                    userRemoteConfigs: [
                        [
                            credentialsId: 'ConfluentJenkins Github SSH Key',
                            url: 'git@github.com:confluentinc/ksqldb-graphql.git'
                        ]
                    ]
                ]

                configureGitSSH("github/confluent_jenkins", "private_key")
                sh 'git config --global user.email "jenkins@confluent.io"'
                sh 'git config --global user.name "Confluent Jenkins Bot"'
                sh 'git checkout $BRANCH_NAME'
                sh 'git pull origin $BRANCH_NAME --force'
            } else {
                checkout scm
            }

            buildData.revision = sh(returnStdout: true, script: 'git rev-parse --short=7 HEAD').trim()
        }

        currentBuild.displayName = "#${env.BUILD_NUMBER} ${buildData.revision}"

        if (params.PUBLISH_A_RELEASE) {
            currentBuild.displayName = "${currentBuild.displayName} Publishing a ksqldb-graphql release"
        }

        stage('install') {
            sh '''
                yarn config list
                yarn config current
                yarn in
            '''
        }

        def pStages = ['linting', 'unit tests', 'buildJs'].collectEntries {stageLabel -> [stageLabel, {
            if (stageLabel == 'linting') {
                lintStages(buildData, params)
            }

            if (stageLabel == 'unit tests') {
                unitTestsStage(buildData, params)
            }
            if (stageLabel == 'buildJs') {
                try {
                  buildJsStage(buildData, params, env)
                } catch (Exception e){
                  buildData.buildJsStatus = 'Failure'
                  throw e
                }
            }

        }]}

        pStages.failFast = true;

        parallel(pStages)

        // at this point the build is gauranteed ok due to failFast
        if (buildData.buildStatus != 'Unstable') {
            buildData.buildStatus = 'Success'
        }

    } catch (hudson.AbortException e) {
        // Exit code 143 = SIGTERM from user abort.
        if (e.message.contains('script returned exit code 143')) {
            buildData.buildStatus = 'Aborted'
        }
        throw e

    } finally {

        if (!buildData.isPrJob && params.PUBLISH_A_RELEASE) {
            slackNotify(
                status: buildData.buildStatus,
                detail: "New release published: https://github.com/confluentinc/ksqldb-graphql/releases",
                channel: '#ksql-fe',
                always: true
            )
        }

    }
}
