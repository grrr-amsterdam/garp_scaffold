#!/bin/sh

init() {
    if [ -z "$1" ]; then
        echo "Provide the environment as the first argument."
        echo "$ sh deploy.sh staging"
        exit
    fi

    [ -f "dependencies.sh" ] && . dependencies.sh
}

deploy() {
    echo '🤖  [Deploying]' 
    bundle exec cap $1 deploy
}

init &&
deploy $1
