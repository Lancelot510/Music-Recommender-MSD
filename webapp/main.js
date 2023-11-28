var similar_songs_csv= 'data/song_similarity_recommendations_500k.csv';
var user_songs_csv= 'data/user_song_recommendations_500k.csv';
var nodes_csv = 'data/updated_file.csv';

// SVG Dimensions
var width = 1080;
var height = 720;
var margins = { left: 50, right: 50, top: 50, bottom: 50 };
var networkGraphWidth = width - margins.left - margins.right;
var networkGraphHeight = height - margins.top - margins.bottom;
var radiusScale = d3.scaleLinear().range([5, 25]);
const colors = { 'SELECTED': '#E0538F', 'DEFAULT': '#2E64A2', 'EXPANDED': '#95D134'};
var nodes, edges, edges2, allNodesMap, songEdges;
var users, songs;
var sliderValue;
var graphData, graph, selectedSong, selectedUser, graphDataMap, recommendationsDiv;
var recommendations = [];
var expandedSongs = [];
var force;

const slider = document.getElementById("similar_count_slider");

let tip = d3.tip().attr('class', 'd3-tip').attr("id", "tooltip");

const search = document.getElementById("search");

Promise.all([
    d3.dsv(",", similar_songs_csv, function (ssr) {
        return {
            user: ssr.source_song_id,
            target: ssr.target_song_id,
            rank: parseInt(ssr.rank)
        };
    }),
    d3.dsv(",", user_songs_csv, function (usr) {
        return {
            user: usr.user_id,
            song: usr.song_id,
            rank: parseInt(usr.rank)
        };
    }),
    d3.dsv(",", nodes_csv, (node) => {
        return {
            id: node.song_id,
            track_id: node.track_id,
            song_name: node.title,
            artist_name: node.artist_name
            // avg_duration: parseFloat(node.avg_duration),
            // avg_familiarity: parseFloat(node.avg_familiarity),
            // avg_hotness: parseFloat(node.avg_hotttnesss),
            // total_tracks: parseInt(node.total_tracks)
        };
    })
]).then(allData => {
    edges = allData[0]; // all edges data from csv file
    edges2 = allData[1]; // all edges data from csv file
    nodes = allData[2]; // all node data from the csv file

    allNodesMap = nodes.reduce((obj, item, idx) => {
        item['index'] = idx;
        item.children = null;
        obj[item['id']] = item;
        return obj;
    }, {}); // map for quick lookup of nodes by id

    // compute unique users and songs
    users = []
    songs = []
    nodesmap = []

    edges2.forEach(function(row) {
        users[row.user] = {id: row.user, children: []};
        nodesmap[row.user] = {id: row.user, children: []};
    });
    nodes.forEach(function(row) {
        songs[row.song_id] = {id: row.song_id, track_id: row.track_id, song_name: row.title, children: []};
        nodesmap[row.song_id] = {id: row.song_id, track_id: row.track_id, song_name: row.title, children: []};
    });

    
    
    

    radiusScale.domain([1, 10]);

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    graph = svg.append("g")
        .attr("width", networkGraphWidth)
        .attr("height", networkGraphHeight)
        .attr("transform", "translate( " + margins.left + ", " + margins.top + ")");

    recommendationsDiv = d3.select("body")
                           .append("div")
                           .attr("id", "recommendations-div")
    // Show initial network of song based on selected song (How many neighbors to show in the beginning?)

    selectedUser = allNodesMap['b80344d063b5ccb3212f76538f3d9e43d87dca9e'];
    sliderValue = 7;

    fetchGraphData(selectedUser);
    graphDataMap = buildGraphDataMap({});
    drawGraph();
    // displayRecommendations();

    // selectedSong = nodes[2314];
    // sliderValue = 7;

    // fetchGraphData(selectedSong);
    // graphDataMap = buildGraphDataMap({});
    // drawGraph();
    // displayRecommendations();

    // List of songs to display
    var selectTag = d3.select("select");
    console.log("list",users);

    var options = selectTag.selectAll('#select_user')
        .data(users);

    options.enter()
        .append('option')
        .attr('value', function (d) {
            return d.id;
        })
        .attr('id', function (d) {
            return d.id;
        })
        .text(function (d) {
            return d.id
        });
    console.log(search);
    search.addEventListener("click", function () {
        console.log(document.getElementById("user"));
        var e = document.getElementById("user")
        var text = e.options[e.selectedIndex]
        selectedUser = allNodesMap[text.id]
        recommendations = [];
        clearGraph();
        fetchGraphData(selectedUser);
        graphDataMap = buildGraphDataMap({});
        drawGraph();
    })

    // Display initial nodes of top songs to select from
    /*
    var topDiv = d3.select("#top_songs");
    var topSongList = nodes.sort((a, b) => b.avg_familiarity - a.avg_familiarity);

    var disc = topDiv
        .selectAll(".disc")
        .data(topSongList.slice(0, 9))
        .enter()
        .append("button")
        .style("padding", "5px")
        .style("margin", "5px")
        .attr("id", (d) => d.song_id)
        .attr("class", "disc")
        .on("click", function (d) {
            selectedSong = allNodesMap[d.song_id]
            recommendations = [];
            clearGraph();
            fetchGraphData(selectedSong);
            graphDataMap = buildGraphDataMap({});
            drawGraph();
            // displayRecommendations();
        });

    disc.append("text")
        .attr("stroke", "black")
        .attr("font-size", "11px")
        .attr("text-anchor", "middle")
        .text(function (d) {
            return d['song_name'];
        });
    */

    //   Slider 
    /*
    slider.addEventListener("input", function () {
        sliderValue = this.value;
        recommendations = [];
        clearGraph();
        fetchGraphData(selectedSong);
        graphDataMap = buildGraphDataMap({});
        drawGraph();
        // displayRecommendations();
    });
    */

    // Dynamic color of nodes (genre/pin?)

    // Dynamic color and thickness of edges (based on collaboration?)

    // Any other styling for selected node

    // tooltip for nodes
    tip.html(function (d) {
        return getTooltipStats(d);
    });
    graph.call(tip);


}).catch(error => {
    console.log(error)
});

/**
 * Build a map of all current nodes in the network
 * The id of the nodes are the keys in the map
 * The node objects are the values
 * @param currentMap existing map to add the nodes to
 */
function buildGraphDataMap(currentMap) {
    graphData.forEach(node => {
        currentMap[node['id']] = node;
    });
    return currentMap;
}

/**
 * Function to get nodes and edges in the form required for force simulation
 * @param {*} selectedUser node that was selected
 */
function fetchGraphData(selectedUser) {
    console.log(selectedUser);
    selectedUser.children = [];
    graphData = [selectedUser];
    songEdges = getUserNetwork(selectedUser['id'], sliderValue);
    songEdges.forEach(edge => {
        var target = allNodesMap[edge['song']];
        graphData.push(target);
        selectedUser['children'].push(target);
        recommendations.push(target);
    });
}


/**
 * Function to get nodes and edges in the form required for force simulation
 * @param {*} selectedSong node that was selected
 */
function fetchGraphData1(selectedSong) {
    selectedSong.children = [];
    graphData = [selectedSong];
    songEdges = getSongNetwork(selectedSong['id'], sliderValue);
    songEdges.forEach(edge => {
        var target = allNodesMap[edge['target']];
        graphData.push(target);
        selectedSong['children'].push(target);
        recommendations.push(target);
    });
}

/**
 * Function to get the data to show in the tooltip
 * @param {*} hoveredNode node which is currently hovered
 * @returns 
 */
function getTooltipStats(hoveredNode) {
    return "Song Name: " + hoveredNode['song_name'];
        // "<br> Average Duration: " + parseFloat(hoveredNode['avg_duration']).toFixed(2) +
        // "<br> Average Hotness: " + parseFloat(hoveredNode['avg_hotness']).toFixed(2) +
        // "<br> Average Familiarity: " + parseFloat(hoveredNode['avg_familiarity']).toFixed(2) +
        // "<br> Total Tracks: " + hoveredNode['total_tracks'];
}

/**
 * To get the similar artist network from list of edges
 * @param user_id: id of the artist to find the network for
 * @param count: number of similar artists to return sorted by priority
 */
function getUserNetwork(user_id, count = 10) {
    let filtered = edges2.filter(edge => edge['user'] === user_id);

    //create a deep copy of the edges because forceSimulation modifies these edges
    let neighbors = JSON.parse(JSON.stringify(filtered))
    .sort((edge1, edge2) => edge1['rank'] - edge2['rank'])
    .slice(0, count);
    return neighbors;
}

/**
 * To get the similar artist network from list of edges
 * @param song_id: id of the artist to find the network for
 * @param count: number of similar artists to return sorted by priority
 */
function getSongNetwork(song_id, count = 10) {
    let filtered = edges.filter(edge => edge['user'] === song_id);

    //create a deep copy of the edges because forceSimulation modifies these edges
    let neighbors = JSON.parse(JSON.stringify(filtered))
    .sort((edge1, edge2) => edge1['rank'] - edge2['rank'])
    .slice(0, count);
    return neighbors;
}

/**
 * Handle the tick event for force simulation
 */
function tick() {
    path.attr("d", function (d) {
        var dx = d.target.x - d.user.x,
            dy = d.target.y - d.user.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        var test = "M" +
            d.user.x + "," +
            d.user.y + "A" +
            dr + "," + dr + " 0 0,1 " +
            d.target.x + "," +
            d.target.y;
        return test;
    });

    node.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
    });
}


/**
 * Clear the network by removing all children elements
 * @param graph group node under SVG
 */
function clearGraph() {
    graph.selectAll("*").remove();
}

/**
 * Function to plot the nodes, add force simulation, path, etc
 */
function drawGraph() {

   

  // Set the colors for the links and circles for the top nodes
  var topLinkColor = "yellow";
  var topCircleColor = "orange";


    if (force != null)
        force.stop();
    console.log(songEdges);
    force = d3.forceSimulation()
        .nodes(d3.values(graphDataMap))
        .force("link", d3.forceLink(songEdges).id(d => d['user']).distance(150).strength(0.1))
        .force('center', d3.forceCenter(networkGraphWidth / 2, networkGraphHeight / 2))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody().strength(-700))
        .alphaTarget(0.1)
        .on("tick", tick);

   /*  path = graph.append("g")
        .selectAll("path")
        .data(songEdges)
        .enter()
        .append("path") */
        var nodes = force.nodes();
        
   path = graph.append("g")
          .selectAll("path")
          .data(songEdges)
          .enter()
          .append("path")
          .attr("class", "default-link")
          .attr("stroke-width", 2);

    node = graph.selectAll(".node")
        .data(force.nodes())
        .enter().append("g")
        .attr("class", "node")
        .on("dblclick", update)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

   /*  node.append("circle")
        .attr("id", function (d) {
            return d.id;
        })
        .attr("r", function (d) {
            return radiusScale(d['total_tracks']);
        })
        .attr("fill", (d) => {
            if (d['artist_id'] == selectedArtist['artist_id']) return colors.SELECTED;
            else if (d['children'] != null) return colors.EXPANDED;
            return colors.DEFAULT;
        }) */
        console.log("selectedSong",selectedUser);
        node.append("circle")
        .attr("id", function(d) {
          return d.id;
        })
        .attr("r", 10)
        .attr("fill", (d) => {
          if (d['id'] == selectedUser['id']) {
            return colors.SELECTED;
          } else if (d.children != null) {
            return colors.EXPANDED;
          } else {
            return colors.DEFAULT;
          }
        });



    node.append("text")
        .attr("stroke", "black")
        .attr("font-size", "12px")
        .attr("x", 10)
        .attr("y", -5)
        .text(function (d) {
            return (d.song_name);
        });

    force.alpha(0.1).restart()
}

/**
 * Function to display recommendations based on
 * selected and expanded nodes.
 */
/*
function displayRecommendations(){
    const topRecommendations = {};
    for (const song of recommendations) {
        if(song != selectedSong && expandedSongs.indexOf(song) == -1){
            songName = song["song_name"];
            topRecommendations[songName] = topRecommendations[songName] ? topRecommendations[songName] + 1 : 1;
        }
    }
    // Sort to get top 5 recommendations
    var items = Object.keys(topRecommendations).map(function(key) {
        return [key, topRecommendations[key]];
    });
    items.sort(function(first, second) {
        return second[1] - first[1];
    });
    recommendationsToDisplay = items.slice(0, 5);
    console.log(recommendationsToDisplay);
    // TO DO: improve the display of 'recommendationsToDisplay' in UI
    var recommendationsDiv = d3.select("#recommendations-div")
    recommendationsDiv.selectAll("*").remove();
    recommendationsDiv.append("h3")
                      .text("Top-5 Artist Recommendations");
    recommendationsDiv.append("table")
                      .selectAll("tr")
                      .data(recommendationsToDisplay)
                      .enter()
                      .append("tr")
                      .append("td")
                      .text(function(d){ return d[0]; });
    console.log("out")
}
*/


/**
 * Function to handle double click event of a node
 * @param d node that was clicked
 */
function update(d) {
    console.log("allnodemap",allNodesMap);
    console.log("graph",graphData);

    
    if (d.children != null) {
        var idx = expandedSongs.indexOf(d);
        if (idx !== -1) {
            expandedSongs.splice(idx, 1);
        }
        d.children.forEach(child => {
            var index = recommendations.indexOf(child);
            if (index !== -1) {
                recommendations.splice(index, 1);
            }
        });
        let childrenToDelete = d.children.map(child => child['id']);
        songEdges = songEdges.filter(edge => {
            return !(edge['user']['id'] == d['id'] && childrenToDelete.includes(edge['target']['id']))
        });
        var edgeTargets = songEdges.map(edge => edge['target']['id']);
        graphData = graphData.filter(node => {
            let key = node['id'];
            return edgeTargets.includes(key) || key == selectedSong['id']
        });
        graphDataMap = buildGraphDataMap({});
        d.children = null;
        clearGraph();
        drawGraph();
        // displayRecommendations();
    }
    else {
        // get data of similar artists
        expandedSongs.push(d);
        let newSongEdges = getSongNetwork(d['id'], sliderValue);
        d.children = [];
        newSongEdges.forEach(edge => {
            var target = allNodesMap[edge['target']];
            if (graphData.filter(node => node['id'] === target['id']).length == 0) {
                graphData.push(target);
            }
            d.children.push(target);
            recommendations.push(target);
        });
        songEdges = songEdges.concat(newSongEdges);
        graphDataMap = buildGraphDataMap(graphDataMap);
        clearGraph();
        drawGraph();
        // displayRecommendations();
    }
    
}
