require "./lib/init"

disable :logging
set :root, File.dirname(__FILE__) + "/../"

def get_ideas(session, cluster=nil)
	ideas = cluster ? $redis.smembers("cluster:#{session}:#{cluster}:ideas") : $redis.zrange("session:#{session}:ideas", 0, -1)
	ideas.map do |idea|
		$redis.hgetall(idea)
	end
end

def get_unsorted(id)
	get_ideas(id).select do |idea|
		idea['cluster'].nil?
	end
end

def get_clusters(id)
	clusters = $redis.smembers "session:#{id}:clusters"
	clusters.map do |cluster|
		$redis.hgetall(cluster)
	end
end

def get_idea(session, idea)
	$redis.hgetall "idea:#{session}:#{idea}"
end

def destroy_idea(session, idea)
	$redis.zrem "session:#{session}:ideas", "idea:#{session}:#{idea}"
	$redis.del "idea:#{session}:#{idea}"
end

def remove_idea_from_cluster(session, cluster, idea)
	$redis.srem "cluster:#{session}:#{cluster}:ideas", "idea:#{session}:#{idea}"
	$redis.hdel "idea:#{session}:#{idea}", "cluster"
end

def add_idea_to_cluster(session, cluster, idea)
	$redis.sadd "cluster:#{session}:#{cluster}:ideas", "idea:#{session}:#{idea}"
	$redis.hset "idea:#{session}:#{idea}", "cluster", "cluster:#{session}:#{cluster}"
end

def destroy_cluster(session, cluster)
	cluster_ideas = $redis.smembers "cluster:#{session}:#{cluster}:ideas"
	cluster_ideas.each do |idea|
		$redis.hdel idea, "cluster"
	end
	$redis.srem "session:#{session}:clusters", "cluster:#{session}:#{cluster}"
	$redis.del "cluster:#{session}:#{cluster}:ideas"
	$redis.del "cluster:#{session}:#{cluster}"
end

def save_idea(session, idea, id = nil)
	# TODO atomicity
	idea[:id] = id || get_new_id("session:#{session}:ideas")
	idea.each do |k,v|
		$redis.hset "idea:#{session}:#{idea[:id]}", k, v
	end
	$redis.zadd "session:#{session}:ideas", 0, "idea:#{session}:#{idea[:id]}" unless id
	idea
end

def save_cluster(session, cluster, id = nil)
	# TODO atomicity
	cluster[:id] = id || get_new_id("session:#{session}:clusters", false)
	cluster.each do |k,v|
		$redis.hset "cluster:#{session}:#{cluster[:id]}", k, v
	end
	$redis.sadd "session:#{session}:clusters", "cluster:#{session}:#{cluster[:id]}" unless id
	cluster
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
		candidate = base62((rand * 9999999999999999 + Time.now.to_i).to_i)
	end while (sorted ? !!$redis.zrank(set_id, candidate) : $redis.sismember(set_id, candidate))
	return candidate
end

def get_new_session
	key = "" 
	begin
		key = base62((rand * 90000000000).to_i + 100000000)
	end while $redis.sismember("melee:sessions", key)
	$redis.sadd "melee:sessions", key
	return key
end

post "/" do
	content_type "application/json"
	k = get_new_session
	puts k
	{:id => k}.to_json
end

post "/:id/ideas" do
	content_type "application/json"
	idea = JSON.parse(request.body.read)
	save_idea(params[:id], idea).to_json
end

post "/:id/clusters" do
	content_type "application/json"
	cluster = JSON.parse(request.body.read)
	save_cluster(params[:id], cluster).to_json
end

get "/:id/ideas" do
	content_type "application/json"
	get_ideas(params[:id]).to_json
end

get "/:session/clusters/:id/ideas" do
	content_type "application/json"
	get_ideas(params[:session], params[:id]).to_json
end

get "/:id/unsorted" do
	content_type "application/json"
	get_unsorted(params[:id]).to_json
end

get "/:id/clusters" do
	content_type "application/json"
	get_clusters(params[:id]).to_json
end

delete "/:session/ideas/:id" do
	destroy_idea(params[:session], params[:id])
	""
end

delete "/:session/clusters/:id" do
	destroy_cluster(params[:session], params[:id])
	""
end

delete "/:session/clusters/:cluster/ideas/:id" do
	remove_idea_from_cluster params[:session]), params[:cluster], params[:id]
	""
end

post "/:session/clusters/:cluster/ideas/:id" do
	content_type "application/json"
	add_idea_to_cluster params[:session]), params[:cluster], params[:id]
	get_idea(params[:session], params[:id]).to_json
end

put "/:session/ideas/:id" do
	content_type "application/json"
	idea = JSON.parse(request.body.read)
	save_idea(params[:session], idea, params[:id]).to_json
end

put "/:session/clusters/:id" do
	content_type "application/json"
	cluster = JSON.parse(request.body.read)
	save_cluster(params[:session], cluster, params[:id]).to_json
end

# Session urls
get "/:id" do
	redirect_to "/#{params[:id]}/ideate"
end

# APP ENTRY POINTS
get "/" do
	erb :index
end

get "/:id/ideate" do
	@ideas = get_ideas(params[:id]).to_json
	@sessionid = params[:id]
	erb :ideate
end

get "/:id/cluster" do
	@unsorted = get_unsorted(params[:id]).to_json
	@sessionid = params[:id]
	@clusters = get_clusters(params[:id]).to_json
	erb :cluster
end

get "/:id/prioritize" do
	erb :prioritize
end

get "/:id/export" do
	erb :export
end