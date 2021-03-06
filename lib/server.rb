require "./lib/init"

disable :logging
enable :sessions
set :session_secret, 'melee super top secret session key'

set :root, File.dirname(__FILE__) + "/../"

javascript_bundle(:all, %w(
	vendor/jquery-1.6.2.min
	vendor/jquery-ui-1.8.14.custom.min
	vendor/blind_with_stepping
	vendor/jquery.ui.touch
	vendor/underscore
	vendor/backbone
	app/models/socket
	app/models/session
	app/models/idea
	app/models/idea-list
	app/models/cluster
	app/models/cluster-list
	app/models/message
	app/models/message-list
	app/models/user
	app/models/user-list
	app/models/vote
	app/models/vote-list
	app/views/idea
	app/views/idea-list
	app/views/cluster
	app/views/cluster-list
	app/views/clustered-result-list
	app/views/message
	app/views/message-list
	app/views/user
	app/views/user-list
	app/routes/session
	app/routes/ideate
	app/routes/cluster
	app/routes/prioritize
	app/routes/export
	app/routes/chat
	app/routes/router
	)) 
disable(:compress_bundles)

SOCKET_IO_HOST = 'meleeapp.com:8000'

def get_ideas(session, cluster=nil)
	ideas = cluster ? $redis.smembers("cluster:#{session}:#{cluster}:ideas") : $redis.zrange("session:#{session}:ideas", 0, -1)
	ideas.map do |idea|
		$redis.hgetall(idea)
	end
end

def get_results(session)
	ideas_with_scores = $redis.zrevrangebyscore("session:#{session}:ideas", "+inf", "(0", :withscores => true)
	i = 0
	ideas_for_json = []
	ideas_with_scores.each do |idea_with_score|
		temp_idea = $redis.hgetall(idea_with_score.first)
		temp_idea["score"] = idea_with_score.last.to_i
		temp_idea["cluster"] = $redis.hgetall(temp_idea["cluster"])
		ideas_for_json << temp_idea
	end
	return ideas_for_json
end

def get_voted_ideas(user)
	$redis.smembers "#{user}:votes"
end

def get_votes(user)
	get_voted_ideas(user).map do |id|
		{:idea => id, :id => id, :idea_model => $redis.hgetall(id)}
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

def get_cluster(session, cluster)
	$redis.hgetall "cluster:#{session}:#{cluster}"
end

def get_idea(session, idea)
	$redis.hgetall "idea:#{session}:#{idea}"
end

def destroy_idea(session, idea)
	cluster = $redis.hget "idea:#{session}:#{idea}", "cluster"
	remove_idea_from_cluster(session, cluster.split(":").last, idea) if cluster
	remove_votes_from_idea(session, idea, cluster)
	$redis.zrem "session:#{session}:ideas", "idea:#{session}:#{idea}"
	$redis.del "idea:#{session}:#{idea}"
	return cluster.split(":").last if cluster
	return nil
end

def remove_votes_from_idea(session, idea, cluster)
	users = $redis.smembers "session:#{session}:users"
	users.each do |user|
		removed = $redis.srem "#{user}:votes", "idea:#{session}:#{idea}"
		if removed
			json_cluster = {:id => cluster.split(":").last} if cluster
			$redis.publish "melee:data:#{params[:session]}:vote retracted", {:id => idea, :cluster => json_cluster}.to_json
		end
	end
end

def remove_idea_from_cluster(session, cluster, idea)
	$redis.srem "cluster:#{session}:#{cluster}:ideas", "idea:#{session}:#{idea}"
	$redis.hdel "idea:#{session}:#{idea}", "cluster"
	$redis.hincrby "cluster:#{session}:#{cluster}", "ideas_count", -1
end

def add_idea_to_cluster(session, cluster, idea)
	$redis.sadd "cluster:#{session}:#{cluster}:ideas", "idea:#{session}:#{idea}"
	$redis.hset "idea:#{session}:#{idea}", "cluster", "cluster:#{session}:#{cluster}"
	$redis.hincrby "cluster:#{session}:#{cluster}", "ideas_count", 1
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
	cluster['ideas_count'] = 0
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

def get_or_create_user(session_object, session_id)
	unless(session_object[session_id][:userid])
		session_object[session_id][:userid] = get_new_id("session:#{session_id}:users", false)
		$redis.sadd "session:#{session_id}:users", "user:#{session_id}:#{session_object[session_id][:userid]}"
		$redis.hset "user:#{session_id}:#{session_object[session_id][:userid]}", "votes", 5
		$redis.hset "user:#{session_id}:#{session_object[session_id][:userid]}", "id", "user:#{session_id}:#{session_object[session_id][:userid]}"
	end
	tmp = $redis.hgetall "user:#{session_id}:#{session_object[session_id][:userid]}"
	# fix for redis results coming back as strings all the time
	tmp["votes"] = tmp["votes"].to_i
	return tmp
end

before "/:sessionid/*" do 
	@sessionid = params[:sessionid]
	session[@sessionid] ||= {}
	@current_user = get_or_create_user session, @sessionid
end

post "/" do
	content_type "application/json"
	{:id => get_new_session}.to_json
end

post "/:id/ideas" do
	content_type "application/json"
	idea = JSON.parse(request.body.read)
	idea_json = save_idea(params[:id], idea).to_json
	$redis.publish "melee:data:#{params[:id]}:new idea", idea_json
	idea_json
end

post "/:id/clusters" do
	content_type "application/json"
	cluster = JSON.parse(request.body.read)
	cluster_json = save_cluster(params[:id], cluster).to_json
	$redis.publish "melee:data:#{params[:id]}:new cluster", cluster_json
	cluster_json
end

get "/:id/ideas" do
	content_type "application/json"
	get_ideas(params[:id]).to_json
end

get "/:id/results" do
	content_type "application/json"
	get_results(params[:id]).to_json
end

get "/:sessionid/clusters/:id/ideas" do
	content_type "application/json"
	get_ideas(params[:sessionid], params[:id]).to_json
end

get "/:sessionid/user/ideas" do
	content_type "application/json"
	get_votes(@current_user["id"]).to_json
end

get "/:id/unsorted" do
	content_type "application/json"
	get_unsorted(params[:id]).to_json
end

get "/:id/clusters" do
	content_type "application/json"
	get_clusters(params[:id]).to_json
end

["/:sessionid/ideas/:id" , "/:session/unsorted/:id"].each do |route|
	delete route do
		cluster = destroy_idea(params[:sessionid], params[:id])
		$redis.publish "melee:data:#{params[:session]}:destroy idea", {:id => params[:id], :cluster => cluster}.to_json
		""
	end
end

delete "/:sessionid/clusters/:id" do
	destroy_cluster(params[:sessionid], params[:id])
	$redis.publish "melee:data:#{params[:session]}:destroy cluster", {:id => params[:id]}.to_json
	""
end

delete "/:sessionid/clusters/:cluster/ideas/:id" do
	remove_idea_from_cluster params[:sessionid], params[:cluster], params[:id]
	$redis.publish "melee:data:#{params[:session]}:remove idea from cluster", {:cluster => params[:cluster], :id => params[:id]}.to_json
	""
end

put "/:sessionid/clusters/:cluster/ideas/:id" do
	content_type "application/json"
	add_idea_to_cluster params[:sessionid], params[:cluster], params[:id]
	idea_json = get_idea(params[:sessionid], params[:id]).to_json
	$redis.publish "melee:data:#{params[:session]}:move to cluster", idea_json
	idea_json
end

put "/:sessionid/ideas/:id" do
	content_type "application/json"
	idea = JSON.parse(request.body.read)
	save_idea(params[:sessionid], idea, params[:id]).to_json
end

put "/:sessionid/clusters/:id" do
	content_type "application/json"
	cluster = JSON.parse(request.body.read)
	save_cluster(params[:sessionid], cluster, params[:id]).to_json
end

get "/:sessionid/clusters/:id" do
	content_type "application/json"
	get_cluster(params[:sessionid], params[:id]).to_json
end

get "/:id/user" do
	content_type "application/json"
	@current_user.to_json
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
	erb :ideate
end

get "/:id/cluster" do
	@unsorted = get_unsorted(params[:id]).to_json
	@clusters = get_clusters(params[:id]).to_json
	erb :cluster
end

get "/:id/prioritize" do
	@clusters = get_clusters(params[:id]).to_json
	@votes = get_votes(@current_user["id"]).to_json
	erb :prioritize
end

get "/:id/export" do
	@results = get_results(params[:id]).to_json
	erb :export
end