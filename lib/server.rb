require "./lib/init"

disable :logging
set :root, File.dirname(__FILE__) + "/../"

get "/" do
	erb "a"
end

def get_ideas(id)
	ideas = $redis.zrange "session:#{id}:ideas", 0, -1
	ideas.map do |idea|
		$redis.hgetall(idea)
	end
end

def destroy_idea(session, idea)
	$redis.zrem "session:#{session}:ideas", "idea:#{session}:#{idea}"
	$redis.del "idea:#{session}:#{idea}"
end

def save_idea(session, idea)
	# TODO atomicity
	idea[:id] = get_new_id("session:#{session}:ideas")
	idea.each do |k,v|
		$redis.hset "idea:#{session}:#{idea[:id]}", k, v
	end
	$redis.zadd "session:#{session}:ideas", 0, "idea:#{session}:#{idea[:id]}"
	idea
end

def get_new_id(set_id, sorted=true)
	candidate = ""
	begin
		candidate = (rand * 9999999999999999 + Time.now.to_i).to_i.to_s(36) << (rand * 9999999999999999 + Time.now.to_i).to_i.to_s(36) << (rand * 9999999999999999 + Time.now.to_i).to_i.to_s(36)
	end while (sorted ? !!$redis.zrank(set_id, candidate) : $redis.sismember(set_id, candidate))
	return candidate
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
	redirect_to "/#{params[:id]}/ideate"
end

get "/:id/ideate" do
	erb "window.ideas = new IdeaList(#{get_ideas(params[:id]).to_json}, {url:'/#{params[:id]}/ideas'});"
end

get "/:id/cluster" do
	
end

get "/:id/order" do
	
end

get "/:id/export" do
	
end