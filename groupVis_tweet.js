var dataOptions = function(){
	this.user_time = "first_post";
	this.user_name = "user";
	this.user_height = "Twitter Followers";
	this.user_size = "Total Retweets";
	this.user_label = "Overall Sentiment";
	this.user_label_text = "Users";
	this.children = "children";
	this.children_time = "time";
	this.children_text = "text";
	this.children_height = "Twitter Retweets";
	this.children_size = "Twitter Reply Count";
	this.children_label = "sentiment";
	this.children_label_text = "Tweets";
	this.label_class = {"positive": "positive", "negative": "negative", "neutral": "neutral"};
	this.time_formatter = d3.time.format('%m/%d/%Y %H:%M:%S');
}

var fbViz = function () {
	this.data = null;
	this.users = {};
	this.slider = new Object();
	this.dataOptions = new dataOptions();
	$_SLIDER = this.slider;
	$_THIS = this; // Copied the object instance to variable so as to use in nested function calls.

	this.setCSSProps = function (cssObj) {
		this.margin = cssObj.margin;
		this.width = cssObj.width;
		this.height = cssObj.height;
		this.comment_y = this.height;
		this.divId = cssObj.divId;

	};

	function brushed() {
		$_THIS.x.domain($_THIS.brush.empty() ? $_SLIDER.x.domain() : $_THIS.brush.extent());
		if($_THIS.brush.empty()){
			$("#reset-brush").prop("disabled", true);
			//console.log($_THIS.x.domain());
		}
		else{
			$("#reset-brush").prop("disabled", false);
			//console.log($_THIS.x.domain());
		}
		//$_THIS.focus.select(".x.axis").call($_THIS.xAxis);
		$_THIS.posts.filter(function (d) {
			//console.log(d);
			/*console.log($_THIS.brush.extent());
			console.log("X Domain", $_THIS.x.domain());*/
			return (d.created_at >= $_THIS.x.domain()[0]
				 && d.created_at <= $_THIS.x.domain()[1]) ? true : false;
		}).classed("hideElem", false);
		$_THIS.posts.filter(function (d) {
			//console.log(d);
			//console.log($_THIS.brush.extent());
			return (d.created_at < $_THIS.x.domain()[0]
				 || d.created_at > $_THIS.x.domain()[1]) ? true : false;
		}).classed("hideElem", true);

	}

	this.sliderProps = function (cssObj) {
		this.slider.margin = cssObj.margin;
		this.slider.height = cssObj.height;
		this.slider.x = d3.time.scale().range([0, this.width]);
		this.slider.y = d3.scale.linear().range([this.slider.height, 0]);
		this.slider.xAxis = d3.svg.axis().scale(this.slider.x).orient("bottom");

		this.brush = d3.svg.brush()
			.x(this.slider.x)
			.on("brush", brushed);

		this.slider.line = d3.svg.line()
			.interpolate("step")
			.x(function (d) {
				return $_SLIDER.x(d.created_at);
			})
			.y(function (d) {
				return $_SLIDER.y(d.comments_size + 1);
			});

	};

	this.cleanData = function (data) {
		this.users = {};
		data.forEach(function (d) {
			d.poster = d[$_THIS.dataOptions.user_name];
			d.comments_size = 0;
			d.comments_arr = [];
			d.like_size = 0;
			if (($_THIS.dataOptions.children in d)) {
				d.comments_arr = d[$_THIS.dataOptions.children];
				d.comments_size = d[$_THIS.dataOptions.user_size];
				d.like_size = d[$_THIS.dataOptions.user_height];
			}
			console.log("Before Parse: "+$_THIS.dataOptions);
			d.created_at = d[$_THIS.dataOptions.user_time];
			if (!(d[$_THIS.dataOptions.user_name]in $_THIS.users)) {
				$_THIS.users[d[$_THIS.dataOptions.user_name]] = {
					name : d[$_THIS.dataOptions.user_name],
					count : d.comments_size,
					posts : 0,
					comments : 0
				};
			}
		});
		this.sortedIds = Object.keys(this.users).sort(function (x, y) {
				// body...
				return $_THIS.users[y].count - $_THIS.users[x].count;

			});

		data.sort(function (x, y) {
			return x.created_at - y.created_at;
		});

		$('#users')
		.find('option')
		.remove();
		$.each(this.sortedIds, function (key, value) {
			$('#users')
			.append($("<option></option>")
				.attr("value", value)
				.text($_THIS.users[value].name +
					" ( Total: " + $_THIS.users[value].count +
					", Posts: " + $_THIS.users[value].posts +
					", Comments: " + $_THIS.users[value].comments + " )"));
		});
		this.data = data;

	};

	this.init = function (data, cssObj, sliderCSSObj, uid, dataOptions) {
		this.dataOptions = dataOptions;
		console.log(this.dataOptions);
		this.cleanData(data);
		this.setCSSProps(cssObj);
		this.sliderProps(sliderCSSObj);
		this.uid = uid;
		if (this.uid == null) {
			this.uid = [this.sortedIds[0]]
		}
		console.log(this.uid);
		this.svg = new Object();
		this.focus = new Object();
		this.explain = new Object();

		this.posts = new Object();
		this.post_y = 50;
		this.comment_y = this.height;
		this.legend = new Object();

		this.x = d3.time.scale()
			.range([this.margin.left, this.width - this.margin.right])
			.domain(d3.extent(this.data, created_at));

		this.vdiff_post_comment = 100;
		this.y = d3.scale.linear()
			.range([this.height - this.vdiff_post_comment, 50])
			.domain(d3.extent(this.data, function (d) {
					return d.like_size;
				}));

		this.comment_y_scale = d3.scale.linear()
			.range([this.height, this.height - this.vdiff_post_comment+10])
			.domain([0, d3.max(this.data, function (d) {
					return d3.max(d[$_THIS.dataOptions.children], function(t){
						return t[$_THIS.dataOptions.children_height];
					});
				})]
			);

		this.postRadius = d3.scale.linear()
		.range([5, 20])
		.domain(d3.extent(this.data, function (d) {
				return d.comments_size;
			}));

		this.commentRadius = d3.scale.linear()
			.range([3, 10])
			.domain(d3.extent(this.data, function (d) {
					return d3.max(d.comments_arr, function (t) {
						return c_link_size(t);
					})
				}));

		this.slider.x.domain(this.x.domain());
		this.slider.y.domain(this.commentRadius.domain());

		console.log(this.commentRadius.domain());
	}

	function created_at(d) {
		return d.created_at;
	}
	function c_link_size(d) {
		if (this.dataOptions.children_height in d) {
			return d[this.dataOptions.children_size];
		}
		return 0;
	}

	var formatTime = this.dataOptions.time_formatter;

	this.setAxes = function () {
		// body...
		this.xAxis = d3.svg.axis()
			.scale(this.x)
			.orient("bottom")
			.ticks(d3.time.tuesdays)
			.tickFormat(formatTime)
			.tickSize(-this.height)
			.tickPadding(10);

		this.xAxis1 = d3.svg.axis()
			.scale(this.x)
			.orient("bottom")
			.ticks(d3.time.thursdays)
			.tickFormat(formatTime)
			.tickSize(-this.height)
			.tickPadding(10);

		this.yAxis = d3.svg.axis()
			.scale(this.y)
			.orient("right")
			.tickSize(this.width - this.margin.right)
			.tickPadding(10);

		this.tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([-10, 0])
			.html(function (d) {
				var txt = "";
				if($_THIS.dataOptions.user_name in d){
					return "<div style='width:400px;'><strong style='color:red'>" +
				 	d[$_THIS.dataOptions.user_name] +
				  	":</strong> <span>" + d[$_THIS.dataOptions.user_height] + "</span>";
				} else if($_THIS.dataOptions.children_text in d){
					return "<div style='width:400px;'><strong style='color:red'>" +
				 	d[$_THIS.dataOptions.children_text] +
				  	":</strong> <span>" + d[$_THIS.dataOptions.children_height] + "</span>";
				}
			});
	};

	this.drawChart = function () {
		this.setAxes();

		this.svg = d3.select(this.divId)
			.append('svg')
			.attr("style", "background-color: #C0C0C0; border-radius: 10px;");

		this.focus = this.svg.append("g")
			.attr("class", "focus")
			.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

		this.explain = this.svg.append("g")
			.attr("class", "explain")
			.attr("transform", "translate(" + (this.width+this.margin.left) + "," + this.margin.top + ")")
			.attr("fill", "#ffffff");

		this.slider.context = this.svg.append("g")
			.attr("class", "context")
			.attr("transform", "translate(" + $_SLIDER.margin.left + "," + ($_SLIDER.margin.top + $_SLIDER.margin.bottom) + ")");

		$_SLIDER.context.append("path")
		.datum(this.data)
		.attr("class", "area")
		.attr("d", $_SLIDER.line);

		$_SLIDER.context.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + ($_SLIDER.height) + ")")
		.call($_SLIDER.xAxis);

		$_SLIDER.context.append("g")
		.attr("class", "x brush")
		.call(this.brush)
		.selectAll("rect")
		.attr("y", -2 * $_SLIDER.margin.bottom - $_SLIDER.height)
		.attr("height", 2 * $_SLIDER.height + 2 * $_SLIDER.margin.bottom);

		this.focus.call(this.tip);

		var formatDay = d3.time.format('%a');
		this.focus.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + this.height + ")")
		.call(this.xAxis)
		.selectAll('text')
		.style("text-anchor", "end")
		.attr("dx", "-10px")
		.attr("dy", "0")
		.attr("class", function (d) {
			//console.log(d);
			return "date_tick " + formatDay(d);
		})
		.attr("transform", function (d) {
			return "rotate(-90)"
		});

		this.focus.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + this.height + ")")
		.call(this.xAxis1)
		.selectAll('text')
		.style("text-anchor", "end")
		.attr("dx", "-10px")
		.attr("dy", "0")
		.attr("class", function (d) {
			console.log(d);
			return "date_tick " + formatDay(d);
		})
		.attr("transform", function (d) {
			return "rotate(-90)"
		});

		this.focus.append("g")
		.attr("class", "y axis")
		.call(this.yAxis)
		.selectAll('text')
		.attr('class', 'date_tick');

		this.focus.append("text")
		.attr("class", "x label")
		.attr("text-anchor", "end")
		.attr("x", this.width - this.margin.right - 5)
		.attr("y", this.height - 10)
		//.text("Comments");
		.text($_THIS.dataOptions.children_label_text);

		this.focus.append("text")
		.attr("class", "x label")
		.attr("text-anchor", "end")
		.attr("x", this.width - this.margin.right - 5)
		.attr("y", this.height - this.vdiff_post_comment - 10)
		//.text("Posts");
		.text($_THIS.dataOptions.user_label_text);

		this.focus.append("text")
		.attr("class", "y label")
		.attr("text-anchor", "end")
		.attr("x", this.width - this.margin.right - 5)
		.attr("y", 10)
		.attr("transform", "rotate(-90, "+(this.width - this.margin.right - 5)+", 10)")
		//.text("# Likes");
		.text($_THIS.dataOptions.user_height);

		this.explain.append("text")
		.attr("x", 10)
		.attr("y", this.height - this.vdiff_post_comment - 10)
		//.text("Post size = Number of comments");
		.text("User Size = "+$_THIS.dataOptions.user_size);

		this.explain.append("text")
		.attr("x", 10)
		.attr("y", this.height - 10)
		//.text("Comment size = Number of likes");
		.text("Tweet Size = "+$_THIS.dataOptions.children_size);

		this.explain.append("text")
		.attr("x", 10)
		.attr("y", this.height + 60)
		.text("Overall Post Activity");

		this.explain.append("text")
		.attr("x", 10)
		.attr("y", this.height + 70)
		.text("Drag over to highlight");


		this.posts = this.focus.selectAll('g.plots')
			.data(this.data)
			.enter().append('g')
			.classed('plots', true)
			.attr('id', function (d) {
				return d.id;
			})
			.on('mouseover', function (d) {
				d3.select(this).classed('high', true);
				/*tip.show(d);*/
			})
			.on('mouseout', function (d) {
				d3.select(this).classed('high', false);
				/*tip.hide(d);*/
			});
		//posts.call(tip);


		function postClass(d) {
			var h = '';
			if($_THIS.dataOptions.user_label in d){
				h = $_THIS.dataOptions.
				label_class[d[$_THIS.dataOptions.user_label]];
			}
			return h;
		}

		function commentClass(d) {
			var h = '';
			h = $_THIS.dataOptions.
				label_class[d[$_THIS.dataOptions.children_label]];
			return h;
		}

		function showDebug(d) {
			console.log(d);
			var debugDiv = d3.select('#debug');
			/*var likeText = '';
			if ('like_size' in d) {
				likeText = '(' + d.like_size + ') ';
			} else if ('like_count' in d) {
				likeText = '(' + d.like_count + ') ';
			}
			var commentList = '';
			if ('comments' in d) {
				commentList = '<br /><ul>';
				for (var i = 0; i < d.comments_arr.length; i++) {
					commentList += '<li><p><strong>(' + d.comments_arr[i].like_count + ') ' + d.comments_arr[i].from.name + ': </strong>' + d.comments_arr[i].message + '</p></li>';
				};
				commentList += '</ul>';
			}

			debugDiv.html('<div class="debug post"><p><strong>' + likeText + d.from.name + ':</strong>' + d.message + commentList + '</p></div>');*/
			debugDiv.html('<pre>'+JSON.stringify(d, undefined, 2)+'</pre>');
		}
		this.posts.append('circle') // Adds a dot per post
		.attr("data-legend", function (d) {
			return "Post " + postClass(d)
		})
		.attr('cx', function (d) {
			return $_THIS.x(d.created_at);
		})
		.attr('cy', function (d) {
			return $_THIS.y(d.like_size);
		})
		.attr('r', function (d) {
			return $_THIS.postRadius(d.comments_size + 1);
		})
		.attr('class', postClass)
		.classed('posts', true)
		.on('mouseover', this.tip.show)
		.on('mouseout', this.tip.hide)
		.on('click', showDebug /*function(d){ console.log(d); /*d3.select('#debug').text(JSON.stringify(d,undefined, 2));}*/
		)
		/*.append("svg:title")
		.text(function(d) { return d.poster+": "+d.message; })*/
	;

		console.log("Posts", this.posts);

		this.posts.selectAll('circle.comment') // Adds a dot per comment
		.data(function (d) {
			return d.comments_arr;
		})
		.enter()
		.append('circle')
		.attr("data-legend", function (d) {
			return "Comment " + commentClass(d)
		})
		.attr('cx', function (d) {
			return $_THIS.x(d[$_THIS.dataOptions.children_time]);
		})
		//.attr('cy', this.comment_y)
		.attr('cy', function(d){
			return $_THIS.comment_y_scale(d[$_THIS.dataOptions.children_height]);
		})
		.attr('r', function (d) {
			return $_THIS.commentRadius(c_link_size(d));
		})
		.attr('class', commentClass)
		.classed('comment', true)
		.on('mouseover', this.tip.show)
		.on('mouseout', this.tip.hide)
		.on('click', showDebug /*function(d){ console.log(d); d3.select('#debug').text(JSON.stringify(d,undefined, 2));}*/
		)
		/*.append("svg:title")
		.text(function(d) { return d['from']['name']+": "+d['message']; })*/
	;

		function genLinks(d) {
			var links = [];
			for (var j = 0; j < d.comments_arr.length; j++) {
				var t = Object();
				t.source = {
					x : $_THIS.x(d[$_THIS.dataOptions.user_time]),
					y : $_THIS.y(d.like_size)
				};
				t.target = {
					x : $_THIS.x(d.comments_arr[j][$_THIS.dataOptions.children_time]),
					//y : $_THIS.comment_y
					y: $_THIS.comment_y_scale(d.comments_arr[j][$_THIS.dataOptions.children_height])
				};
				links.push(t);
			};
			return links;

		}
		this.posts.selectAll('line.edge')
		.data(function (d) {
			return genLinks(d);
		})
		.enter()
		.append('line')
		.classed('edge', true)
		.attr('x1', function (d) {
			return d.source.x;
		})
		.attr('y1', function (d) {
			return d.source.y;
		})
		.attr('x2', function (d) {
			return d.target.x;
		})
		.attr('y2', function (d) {
			return d.target.y;
		});

		this.legend = this.focus.append("g")
			.attr("class", "legend")
			.attr("transform", "translate(" + (this.width + this.margin.right+10) + ",30)")
			.style("font-size", "12px")
			.style("font-family", "sans-serif")
			.call(d3.legend);

		$("#switchlines").prop('checked',false).change(); // Don't show dates by default
		$("#reset-brush").prop("disabled", true); // Disable brush reset button
	};

	this.repaintNodes = function (uids) {
		// body...
		this.uid = uids;
		if (!(uids instanceof Array)) {
			this.uid = [uids];
		}

		console.log("Repainting nodes for user: " + this.users[this.uid[0]].name, this.uid);
		this.posts.selectAll('circle.posts')
		.classed('highlight', function (d) {
			// body...
			//console.log($_THIS.uid);
			//console.log("Match at: ", $.inArray(d['from']['id'].toString(), $_THIS.uid) );
			if ($.inArray(d['from']['id'].toString(), $_THIS.uid) >= 0) {
				return true;
			}
			return false;

		})
		.classed('nohighlight', false);
		this.posts.selectAll('circle.comment')
		.classed('highlight', function (d) {
			// body...
			if ($.inArray(d['from']['id'].toString(), $_THIS.uid) >= 0) {
				return true;
			}
			return false;

		})
		.classed('nohighlight', false);

	};

	this.clearHighlight = function () {
		// body...
		this.posts.selectAll('circle.posts')
		.classed('highlight', false);
		this.posts.selectAll('circle.comment')
		.classed('highlight', false);
	};

	console.log("Toggling buttons");
};