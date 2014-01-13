
// Map ccid_mac to hex color string
var node_mapping = {};
var number_nodes = 0;

var key_map = {};
var keys_in_map = {};

// Keep track of the last time we updated the graph to avoid
// doing it too often.
var last_update = {};
var MIN_INTERVAL_MS = 1000;

var series = 'all';

function add_to_graph(graph, uid, x, y, color, radius) {
	if(typeof(radius)==='undefined') radius = 4;
	pd = {}
	pd[uid] = [x, y]
	pdw = {name: '',
	       data:pd,
	       color:color,
	       lines:{show:true},
	       points:{show:true,
	               radius:radius,
	               fill:true,
	               fillColor:color},
	   };
	graph.addData(pdw);
	if (should_update(graph)) {
		graph.update(series);
	}
}

function should_update (graph) {
	var now = new Date().getTime();

	if (!(graph.__uniqueid in last_update)) {
		last_update[graph.__uniqueid] = 0;
	}

	if (now - MIN_INTERVAL_MS > last_update[graph.__uniqueid]) {
		last_update[graph.__uniqueid] = now;
		return true;
	}
	console.log(last_update);
	return false;
}

function x_format(val, axis) {
	d = new Date(val);

	sec = d.getSeconds();
	if (sec != 0 && sec != 30) {
		return '';
	}

	var leftPad = function(n, pad) {
		n = "" + n;
		pad = "" + (pad == null ? "0" : pad);
		return n.length == 1 ? pad + n : n;
	};

	var hours = d.getHours();
	var isAM = hours < 12;

	if (hours > 12) {
		hours12 = hours - 12;
	} else if (hours == 0) {
		hours12 = 12;
	} else {
		hours12 = hours;
	}

    return hours12 + ":" + leftPad(d.getMinutes()) + ":" +
           leftPad(sec) + " " + ((isAM)?"AM":"PM");
}

function get_color (uid) {
	if (!(uid in node_mapping)) {
		node_mapping[uid] = get_random_color();
	}
	return node_mapping[uid];
}

function get_random_color() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++ ) {
		color += letters[Math.round(Math.random() * 15)];
	}
	return color;
}

function add_to_key (graph, uid, desc, loc, freq, color) {
	uid_stripped = uid.replace(/[^a-zA-Z0-9]/g, '');
	freq = parseFloat(freq);
	if (!(uid in key_map)) {
		// First packet from this device, need to add new row

		// Add this device to the map of known devices
		key_map[uid] = {'description': desc,
		                'location': loc,
		                'color': color};

		// Insert into the table in sorted order
		loc = loc.replace(/[\|]+/g, ", ").replace("|", ", ");
		var new_row = $('<tr id="'+uid_stripped+'" style="color:'
								+ color + '"><td>'+number_nodes+'</td><td>'
								+uid+'</td><td>'+desc+'</td><td>'
								+loc+'</td><td id="'+uid_stripped+'_freq" '
								+'style="text-align: right">'+freq+'</td></tr>');
		var trs = $("#key_table_tbody").children("tr");
		var inserted = false;
		trs.each(function(index,row) {
			var f = $(row).children("td").last().text();
			if (freq > parseFloat(f)) {
				new_row.insertBefore(row);
				inserted = true;
				return false;
			}
		});
		if (!inserted) {
			$("#key_table_tbody").append(new_row);
		}

		// Add a click handler to only show this device
		$("tr#"+uid_stripped).click(function() {
			series = uid;
			graph.update(series);
		});

		// Track the number of devices ("ID" column)
		number_nodes++;
	} else {
		// Only need to update the frequency cell
		$("#"+uid_stripped+"_freq").html(freq);

		// Now swap rows until this one is in the right place
		var this_row = $("#"+uid_stripped);
		while (parseFloat(this_row.prev().children("td").last().text()) < freq)
			$(this_row).prev().before($(this_row));
		while (parseFloat(this_row.next().children("td").last().text()) > freq)
			$(this_row).next().after($(this_row));
	}
}

function fixup_index() {
	$("#key_table_tbody").children("tr").each(function(index,row) {
		$(row).children("td").first().html(index);
	});
}

function add_to_map (map, uid, loc, color) {
	if (!(uid in keys_in_map)) {
		keys_in_map[uid] = {'location': loc, 'color': color};
		uid_stripped = uid.replace(/[^a-zA-Z0-9]/g, '');
		jitter_x = Math.random() * (0.0005) - 0.00025;
		jitter_y = Math.random() * (0.0005) - 0.00025;
		map_loc = [loc[0]+jitter_x, loc[1]+jitter_y]
		L.circle(map_loc, 30, {
			color: color,
			fillColor: color,
			fillOpacity: 1
		}).addTo(map).bindPopup(uid);
	}
}

