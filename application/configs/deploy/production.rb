# @TODO: Remove the set :password line and the password parameter after the public keys are installed with setup:deploy.
set :password, ask("SSH password:", nil)
server '?????????@???????????', password: fetch(:password), roles: %w{web app} 
#server '?????????@???????????', password: fetch(:password), roles: %w{web} 
#set :deploy_to, "???????????????"
set :garp_env, "production"
