#!/bin/sh

install() {
    install_npm_packages
    install_composer_packages
    install_ruby_bundler
}

install_npm_packages() {
    if [ -f yarn.lock ]; then
        if command -v yarn 2>/dev/null; then
            echo '🤖  [Yarn installing]'
            yarn install
        else
            echo 'No Yarn client available.'
        fi
    else
        if command -v npm 2>/dev/null; then
            echo '🤖  [NPM installing]'
            npm i
        else
            echo 'No NPM client available.'
            exit 1
        fi
    fi
}

install_composer_packages() {
    echo '🤖  [PHP Composer installing]'
    if command -v composer 2>/dev/null; then
        composer install
    else
        echo 'No PHP Composer client available.'
        exit 1;
    fi
}

install_ruby_bundler() {
    echo '🤖  [Ruby Gems installing]'
    if command -v gem 2>/dev/null; then
        gem install --user-install bundler
        if command -v bundler 2>/dev/null; then
            bundler
        else
            echo 'No Ruby Gem bundler available.'
        fi
    else
        echo 'No Ruby Gem client available.'
    fi
}

install
