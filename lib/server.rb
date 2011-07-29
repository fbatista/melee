require "./lib/init"

disable :logging
set :root, File.dirname(__FILE__) + "/../"

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

BASE_62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
def base62(num)
	ret = ""
	begin
		t = num % 62
		num = (num - t) / 62
		ret = BASE_62[t..t] + ret
	end while num != 0
	return ret
end

def get_new_id(set_id, sorted=true)
	candidate = ""
	begin
		candidate = base62 (rand * 9999999999999999 + Time.now.to_i).to_i
	end while (sorted ? !!$redis.zrank(set_id, candidate) : $redis.sismember(set_id, candidate))
	return candidate
end

def get_new_session
	key = "" 
	begin
		key = base62 (rand * 999999999999999).to_i
	end while $redis.sismember("melee:sessions", key)
	$redis.sadd "melee:sessions", key
	return key
end

post "/" do
	content_type "application/json"
	{:id => get_new_session}.to_json
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
	@ideas = get_ideas(params[:id]).to_json
	@sessionid = params[:id]
	erb :ideate
end

# APP ENTRY POINTS
get "/" do
	erb :index
end

get "/:id/cluster" do
	erb :cluster
end

get "/:id/prioritize" do
	erb :prioritize
end

get "/:id/export" do
	erb :export
end