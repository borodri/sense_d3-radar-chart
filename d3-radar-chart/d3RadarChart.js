define(["jquery", "text!./radar-chart.css", "./radar-chart", "./d3.min"], function($, cssContent, RadarChart, d3) { //, d3
	'use strict';
		
	$("<style>").html(cssContent).appendTo("head");
	
	return {
		initialProperties : {
			version: 1.0,
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qInitialDataFetch : [{
					qWidth : 3,
					qHeight : 500
				}]
			}
		},
		definition : {
			type : "items",
			component : "accordion",
			items : {
				dimensions : {
					uses : "dimensions",
					min : 1,
					max : 2
				},
				measures : {
					uses : "measures",
					min : 1,
					max : 1
				},
				sorting : {
					uses : "sorting"
				},  
				settings : {
					uses : "settings",
					items : {
						customIntProp: {
							type: "boolean",
							component: "radiobuttons",
							label: "Clockwise",
							ref: "clockorientation",
							options: [ {
									value: true,
									label: "clockwise"
								},{
									value: false,
									label: "counter-clockwise"
								}],
							defaultValue: true
						} ,
						
						customSwitchProp: {
							type: "boolean",
							component: "switch",
							label: "Values on Axis",
							ref: "showNumbersOnAxis",
							options: [ {
								value: true,
								label: "on"
							},{
								value: false,
								label: "off"
							}],
							defaultValue: false
						},					
						
						customSliderProp: {
							type: "integer",
							component: "slider",
							label: "Axis levels",
							ref: "axisLeves",
							min: 3,
							max: 10,
							step: 1,
							defaultValue: 3
						} 
					}					
				}				
			}
		},
		snapshot : {
			canTakeSnapshot : true
		},
		
		paint : function($element,layout) {
		
		var levels = layout.axisLeves;
		var is_clockwise = layout.clockorientation;
		var show_axisnumbers = layout.showNumbersOnAxis;
		
		 // Chart object width
			var width = $element.width();
			// Chart object height
			var height = $element.height();
			// Chart object id
			var id = "container_" + layout.qInfo.qId;
		 
			// Check to see if the chart element has already been created
			if (document.getElementById(id)) {
				// if it has been created, empty it's contents so we can redraw it
				$("#" + id).empty();
			}
			else {
				// if it hasn't been created, create it with the appropiate id and size
				$element.append($('<div />;').attr("id", id).width(width).height(height));
			}		 
					
			// get qMatrix data array
			var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;
			// create a new array that contains the measure labels
			/* var measureLabels = layout.qHyperCube.qMeasureInfo.map(function(d) {
				return d.qFallbackTitle;
			}); */
			var dimensions = layout.qHyperCube.qDimensionInfo;			
			var LegendTitle = dimensions[0].qFallbackTitle;			
			
			// create a new array that contains the dimensions and metric values
			// depending on whether if 1 or 2 dimensions are being used
 			if(dimensions.length==2){			 
				var dim1Labels = qMatrix.map(function(d) {
					 return d[0].qText;
				 });
				 var dim2Labels = qMatrix.map(function(d) {
					 return d[1].qText;
				 });
				 var metric1Values = qMatrix.map(function(d) {
						 return d[2].qNum;
				 }) ;	 
			}
			else{				
				var dim1Labels = qMatrix.map(function(d) {
					 return d[0].qText;
				 });				 
				 var dim2Labels = dim1Labels;
				 var metric1Values = qMatrix.map(function(d) {
					 return d[1].qNum;
				 });				 		 
			} 
			
		var viz = function(width, height, id, dims){

			var data = [];
			var actClassName = "";
			var cont=0;
			var myJson = {};
			myJson.className = ""; 
			myJson.axes = [];
			var contdata=0;
			var LegendValues = [];					
					
			function Dataset() {
			  return data.map(function(d) {
				return {
				  className: d.className,
				  axes: d.axes.map(function(axis) {
					return {axis: axis.axis, value: axis.value};
				  })
				};
			  });
			}
				
			if(dims==2){
				for(var k=0;k<dim1Labels.length;k++){				
						if(actClassName!=dim1Labels[k] ){
								if(cont!=0){
									data[contdata] = myJson;
									contdata++;				
								}
								// it is a different grouping value of Dim1
								LegendValues.push(dim1Labels[k]);
								myJson = {};
								myJson.className = ""; 
								myJson.axes = [];								
									cont =0;
									myJson.className = dim1Labels[k];							
									myJson.axes[cont]  = {"axis": dim2Labels[k], "value" : metric1Values[k]};
									cont++;								
							} else{						
									myJson.axes[cont]  = {"axis": dim2Labels[k], "value" : metric1Values[k]};
									cont++;
									}												
						actClassName =  dim1Labels[k];						
				}				
				data[contdata] = myJson;			
			}
			else{
				for(var k=0;k<dim1Labels.length;k++){									
								// it is a different grouping value of Dim1
								LegendValues.push(dim1Labels[k]);				
									myJson.axes[cont]  = {"axis": dim1Labels[k], "value" : metric1Values[k]};
									cont++;
					}	
					data[contdata] = myJson;
			}
				
				function getMaxOfArray(numArray) {
					return Math.max.apply(null, numArray);
				}				
								
				if (is_clockwise){var rad =  -2 * Math.PI;
				}else{var rad =  2 * Math.PI;}
				
				// Adjust the width the chart will take. When using 2 dimensions, some space will be needed for the legend.
				if (dims==1){ 
					var adjustW = 0.90;
				}else{adjustW = 0.75}
				
				// Keep the same height as width to make all the axis the same length
				if (width >= height){
					var w = height * adjustW;
					var h = height *adjustW;
				}else{
					var h = width * adjustW;
					var w = width  * adjustW;
				}
				
				var showAxisText = true;
				// If the object is too small, hide some options like axis values and axis values. It will look like a 'mini' radar chart.
				if (w <= 200){
					show_axisnumbers = false;
					levels = 3;
					showAxisText = false;
				}
				
				var MaxValue = getMaxOfArray(metric1Values);			
				
				var chart = RadarChart.RadarChart.chart(width, height);			
				var mycfg = {
					  w: w,
					  h: h,
					  factor: 0.90,
					  levels: levels,
					  factorLegend: 1,
					  ToRight: 5,
					  radians: rad,
					  opacityArea: 0.5,
					  maxValue: MaxValue,
					  levelTick: false,
					  axisLine: true,
					  axisText: showAxisText,
					  circles: true,
					  numbersOnAxis: show_axisnumbers,
					  transitionDuration: 1000
					}
				var cfg = chart.config(mycfg); // retrieve default config				
				var margin = { top: 10, right:2, bottom: 10, left: 2},
				
				height = height - margin.top - margin.bottom;
				width = width - margin.left - margin.right;				
				
				var svg = d3.select("#"+id).append('svg')
						  .attr('width', width + 10)
						  .attr('height', height);
						svg.append('g').classed('single', 1).datum(Dataset()).call(chart);
					
				function showlegend(){						
						
						////////////////////////////////////////////
						/////////// Initiate legend ////////////////
						////////////////////////////////////////////
						
						var w = width * 0.75,
							h = height * 0.2;

						var colorscale = d3.scale.category10();
						//Legend titles
						var LegendOptions = LegendValues;
						
						var svg = d3.select("#"+id)
							.selectAll('svg')
							.append('svg')

						//Create the title for the legend
						var text = svg.append("text")
							.attr("class", "title")
							.attr('transform', 'translate(90,0)') 
							.attr("x", w - 65)
							.attr("y", 10)
							.attr("font-size", "12px")
							.attr("fill", "#404040")
							.text(LegendTitle);
								
						//Initiate Legend	
						var legend = svg.append("g")
							.attr("class", "legend")
							.attr("height", 100)
							.attr("width", 200)
							.attr('transform', 'translate(90,20)') 							
							;
							//Create colour squares
							legend.selectAll('rect')
							  .data(LegendOptions)
							  .enter()
							  .append("rect")
							  .attr("x", w - 65)
							  .attr("y", function(d, i){ return i * 20;})
							  .attr("width", 10)
							  .attr("height", 10)
							  .style("fill", function(d, i){ return colorscale(i);})
							  ;
							//Create text next to squares
							legend.selectAll('text')
							  .data(LegendOptions)
							  .enter()
							  .append("text")
							  .attr("x", w - 52)
							  .attr("y", function(d, i){ return i * 20 + 9;})
							  .attr("font-size", "11px")
							  .attr("fill", "#737373")
							  .text(function(d) { return d; })
							  ;	
					};
				
				// Show the legend if 2 dimensions are being used and if the object is big enough to place it.
				if (dims==2 && w >= 200){ 
					showlegend();
				}
				
			};
			
			viz(width, height, id, dimensions.length); 
		}
	}
});
