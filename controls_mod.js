$(document).ready(function () {
    $('#switchlines').change(function () {
        var opacity = 1;
        var state = $($('.axis line')[0]).attr('class');
        /*if (state !== 'down') {
            state = 'down';
            opacity = 'display: none;';
        } else {
            state = '';
            opacity = '';
        }*/
        console.log(this, $(this), this.checked, $(this).checked);
        if (!this.checked) {
            state = 'down';
            opacity = 'display: none;';
        } else {
            state = '';
            opacity = '';
        }
        $('.axis line').attr("class", state);
        $('g.tick').attr("style", opacity);
        console.log("Switch toggled");
    });
    $('#switchhighlight').click(function () {
        $('.plots > .posts, .comment').each(function (i) {
            var state = $(this).attr('class').split(' ');
            var prevC = $(this).attr('class');
            //console.log(state);
            var i = [$.inArray('nohighlight', state), $.inArray('highlight', state)]
            if (i[0] >= 0) {
                state.splice(i[0], 1);
                state.push('highlight');
                state = state.join(' ');
                $(this).attr("class", state);
            } else if (i[1] >= 0) {
                state.splice(i[1], 1);
                state.push('nohighlight');
                state = state.join(' ');
                $(this).attr("class", state);
            }

            console.log(prevC, "==>", $(this).attr('class'));
        });

        /*fObj.clearHighlight();*/

        console.log("Switch toggled");
    });
});

$(function () {
    $('#users').change(function (e) {
        var uid = $(e.target).val();
        console.log(uid);
        fObj.repaintNodes(uid);
        console.dir(uid);
    });
    $('#reset-brush').click(function (e) {
        // body...
        
        $_THIS.x.domain($_SLIDER.x.domain());//added
	    transition_data();//added
	    reset_axis();//added
        
        d3.selectAll(".brush").call(fObj.brush.clear());
        fObj.brush.on('brush')();
        console.log(fObj.brush.empty());
        console.log(fObj.brush.extent());
    });
});

function transition_data() {//function added
		//console.log($_THIS.data);
		//console.log(d3.selectAll("svg"));
	  var yy=$_THIS.comment_y;	
	  var cy=Math.random()*30;//added
	  var side=10;//added
	  d3.selectAll("circle")
	    .data($_THIS.data)
	    .transition()
	    .duration(500)
	    .attr("cx", function(d) {return $_THIS.x(d.created_at); });
	  d3.selectAll(".triangle")
	    .transition()
	    .duration(500)
	    .attr('d', function (d) {
			return 'M ' + $_THIS.x(new Date(d['created_time'])) +' '+ (yy-side) + ' L '+($_THIS.x(new Date(d['created_time']))-side/2*Math.sqrt(2))+ ' ' + (yy+side/2)+' L '+($_THIS.x(new Date(d['created_time']))+side/2*Math.sqrt(2)) +' '+ (yy+side/2)+' L '+($_THIS.x(new Date(d['created_time']))) +' '+ (yy-side);
		});
	}//function added
	
	function reset_axis() {//function added
	  d3.select("svg").transition().duration(500)
	   .select(".x.axis")
	   .call($_THIS.xAxis);
	}//function added

function changeUser(uid) {
    // body...

    console.log(uid);
    fObj.repaintNodes(uid);

}