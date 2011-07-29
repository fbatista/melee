require "./lib/init"

disable :logging
set :root, File.dirname(__FILE__) + "/../"

get "/" do
	erb "a"
end

def get_ideas(id)
	ideas = $redis.smembers "session:#{id}:ideas"
	ideas.map do |idea|
		$redis.hgetall(idea)
	end
end

def destroy_idea(session, idea)
	$redis.srem "session:#{session}:ideas", "idea:#{session}:#{idea}"
	$redis.del "idea:#{session}:#{idea}"
end

def save_idea(session, idea)
	# TODO atomicity between scard and hset
	idea[:id] = $redis.scard("session:#{session}:ideas").to_i + 1
	idea.each do |k,v|
		$redis.hset "idea:#{session}:#{idea[:id]}", k, v
	end
	$redis.sadd "session:#{session}:ideas", "idea:#{session}:#{idea[:id]}"
	idea
end

post "/:id/ideas" do
	content_type "application/json"
	idea = JSON.parse(request.body.read)
	save_idea(params[:id], idea).to_json
end

get "/:id/ideas" do
	content_type "application/json"
	get_ideas(params[:id]).to_json
end

delete "/:session/ideas/:id" do
	destroy_idea(params[:session], params[:id])
	""
end

# Session urls
get "/:id" do
	erb "window.ideas = new IdeaList(#{get_ideas(params[:id]).to_json}, {url:'/#{params[:id]}/ideas'});"
end

get "/:id/ideate" do
	erb "IDEATE ROUTE"
end

get "/:id/cluster" do
	
end

get "/:id/order" do
	
end

get "/:id/export" do
	
end