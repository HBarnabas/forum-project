pipeline {
      environment {
        registry = "hbarnabas/jenkins_test"
        registryCredential = 'hbar_docker'
        dockerImage = ''
    }
    agent any

    stages {
        stage('Cloning Git') {
            steps {
                git 'https://github.com/HBarnabas/forum-project.git'
            }
        }
        stage('Building image') {
            steps {
                script {
                  dockerImage = docker.build registry + ":$BUILD_NUMBER"
                }
            }
        }
        stage('Deploy image') {
            steps {
              docker.withRegistry('', registryCredential) {
                dockerImage.push()
              }
            }
        }
        stage('Cleaning up') {
          steps {
            sh "docker rmi $registry:$BUILD_NUMBER"
          }
        }
    }
}