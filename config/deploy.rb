require 'mina/bundler'
require 'mina/rails'
require 'mina/git'
# require 'mina/rbenv'  # for rbenv support. (http://rbenv.org)
# require 'mina/rvm'    # for rvm support. (http://rvm.io)

# Basic settings:
#   domain       - The hostname to SSH to.
#   deploy_to    - Path to deploy into.
#   repository   - Git repo to clone from. (needed by mina/git)
#   branch       - Branch name to deploy. (needed by mina/git)

set :domain, 'meleeapp.com'
set :deploy_to, '/home/melee/melee'
set :repository, 'ssh://git@bitbucket.org/wbs/melee.git'
set :user, 'melee'
set :branch, 'master'

set :shared_paths, ['tmp', 'node/node_modules']

task :setup  do
  queue! %[mkdir -p "#{deploy_to}/shared/tmp"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/shared/tmp"]

  queue! %[mkdir -p "#{deploy_to}/shared/node"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/shared/node"]

  queue! %[mkdir -p "#{deploy_to}/shared/node/node_modules"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/shared/node/node_modules"]
end

desc "Deploys the current version to the server."
 task :deploy do
   deploy do
     invoke :'git:clone'
     invoke :'deploy:link_shared_paths'
     to :launch do
      invoke :'npm:install'
      invoke :'isolate'
      queue 'forever stop node/app.js 2>/dev/null'
      invoke :start
      queue 'touch tmp/restart.txt'
     end
  end
end

desc "Installing package.json"
task :'npm:install' do
  queue %[cd "#{deploy_to}/current/node" && npm install]
end

desc "Isolating gems"
task :'isolate' do
  queue %[cd "#{deploy_to}/current" && rake isolate:env]
end
 
task :start do
  queue %[cd "#{deploy_to}/current/node" && forever start app.js]
end
 
task :restart do
  queue %[cd "#{deploy_to}/current/node" && forever restart app.js]
end
 
task :stop do
  queue %[cd "#{deploy_to}/current/node" && forever stop app.js]
end

