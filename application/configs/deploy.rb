set :application, 'CHANGE-ME-INTO-YOUR-REPO-NAME'
set :repo_url, 'git@code.grrr.nl:grrr/???????????????'

namespace :deploy do
	task :started do
		on roles(:web) do
			info "No app-specific startup deploy tasks in this project."
		end
	end

	task :updated do
		on roles(:web) do
			info "No app-specific after-update deploy tasks in this project."
		end
	end
end
