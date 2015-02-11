/* GLOBAL VARIABLES
===================================================================================*/
var	dataType = $("meta").attr("content"), filename, w = 600, h = 400, barPadding = 2, startYear = 0, endYear = 0, yearPosition = 0, chart, xScale, yScale, line, maxX, maxY, xAdjust, margin = {all:-1,left:70,right:15,top:30,bottom:30}, axisLabels = {x:"",y:""}, dataPosition = 0, fullMotion = false, padding = 20,	firstRun = true, totalPoints = 0, updatedPointData = [], initReprocess = false, currentData = [], curElemPos = [], years = [], plotData = [], points = [], endPoints = [], startEnd = {}, colors = ["#4169E1","#e14169","#e16941","#41e1b9"], colorsInUse = [0,0,0,0], colorStep = 0, thisColor, colorLoops = 2,toggledLabels = [],progressBar = 0, progressStep = 2.3255813953;

/* GLOABL UTILITY FUNCTIONS
===================================================================================*/
var utilityFunctions = {
	updateSlider:function(val){
		/* HANDLING INTERACTIONS W SLIDER
		------------------------------------*/
		var index;
		//stop motion if in motion
		if (fullMotion == true){
			$("#playMotion").attr("src", "assets/play.png");
			fullMotion = false;
		}
		$("#nav-wrapper h2").text(val); //update slider text
		yearPosition = parseInt(val); //update year position
		for (i=0 ; i < years._wrapped.length ; i++){ //locate year index
			if (yearPosition === years._wrapped[i]){
				index = _.indexOf(years._wrapped, yearPosition);					
				dataPosition = index;
				return chartFunctions.updateChart(index)
			}
		}
	},
	churnLargeNumbers:function(){
		var temp = [];
		var totalLabels = $("text:not(.plotLabels)").length;
		for (i=0 ; i < totalLabels ; i++){
			temp[i] = $("text:not(.plotLabels):eq("+i+")").text();
			//Shorten Axis Labels
			switch(temp[i].length){
				case 5: temp[i] = temp[i].slice(0,1); break;
				case 6: temp[i] = temp[i].slice(0,2); break;
				case 7: temp[i] = temp[i].slice(0,3); break;
				case 9: temp[i] = temp[i].slice(0,1); break;
				case 10: temp[i] = temp[i].slice(0,2); break;
				case 11: temp[i] = temp[i].slice(0,3); break;
			}
			$("text:not(.plotLabels):eq("+i+")").text(temp[i]);
		}
	}
}

/* GLOBAL CHART FUNCTIONS
===================================================================================*/
var chartFunctions = {
	setDefaults:function(){
		/* DRAW CHART
		------------------------------------*/
		chart = d3.select("#chart").append("svg:svg").attr("width", w).attr("height", h);
	},
	defaultToggle:function(chart){
		$('#selection p[label="California"]').click();
	},
	grabData:function(){
		switch(dataType){
			case "IncomeExpendStudent":
				filename = 'data/income-expendstudent.csv';
				startYear = 1970;
				endYear = 2010;
				yearPosition = 1970;
				maxX = 25000;
				maxY = 80000;
				axisLabels.x = "K-12 Expenditures per Student (in thousands)";
				axisLabels.y = "Income per Capita (in thousands)";
				xAdjust = 4;
				progressStep = 2.5;
				break;
			case "TeacherPayStudents":
				filename = 'data/teacherpaystudents.csv';
				startYear = 1970;
				endYear = 2012;
				yearPosition = 1970;
				maxX = 30;
				maxY = 100000;
				axisLabels.x = "K-12 Students per Teacher";
				axisLabels.y = "Average Teacher Salary (in thousands)";
				$("#y-axis").css("left", "-85px");
				xAdjust = -10;
				progressStep = 2.380952381;
				break;
			case "TeachersStudents":
				filename = 'data/teacherstudents.csv';
				startYear = 1970;
				endYear = 2012;
				yearPosition = 1970;
				axisLabels.x = "K-12 Teachers (in thousands)";
				axisLabels.y = "K-12 Students (in millions)";
				maxX = 400000;
				maxY = 8000000;
				xAdjust = -20;
				progressStep = 2.380952381;
				break;
			case "PovertyIncome":
				filename = 'data/povertyincome.csv';
				startYear = 1977;
				endYear = 2013;
				yearPosition = 1977;
				maxX = 80000;
				maxY = 60;
				axisLabels.y = "Percentage of 6-17 Year Olds in Poverty";
				axisLabels.x = "Income per Capita (in thousands)";
				xAdjust = -10;
				progressStep =  2.7777777778;
				break;
			case "NAEPexpend":
				filename = 'data/NAEPexpend.csv';
				startYear = 2003;
				endYear = 2011;
				yearPosition = 2003;
				maxX = 60;
				maxY = 20000;
				axisLabels.x = "Average NAEP Proficency in Math and Reading, 4th and 8th Grades";
				axisLabels.y = "K-12 Expenditures per Student (in thousands)";
				$("#y-axis").css("left", "-100px");
				xAdjust = -10;
				$("#yearSlider").attr("step", 2);
				progressStep = 20;
				break;
			case "NAEPincome":
				filename = 'data/NAEPincome.csv';
				startYear = 2003;
				endYear = 2013;
				yearPosition = 2003;
				maxX = 60;
				maxY = 80000;
				axisLabels.x = "Average NAEP Proficency in Math and Reading, 4th and 8th Grades";
				axisLabels.y = "Income per Capita (in thousands)";
				xAdjust = -10;
				$("#yearSlider").attr("step", 2);
				progressStep = 20;
				break;
			case "NAEPpoverty":
				filename = 'data/NAEPpoverty.csv';
				startYear = 2003;
				endYear = 2013;
				yearPosition = 2003;
				maxX = 60;
				maxY = 60;
				axisLabels.x = "Average NAEP Proficency in Math and Reading, 4th and 8th Grades";
				axisLabels.y = "Percentage of 6-17 Year Olds in Poverty";
				xAdjust = -10;
				$("#y-axis").css("left", "-85px");
				$("#yearSlider").attr("step", 2);
				progressStep = 20;
				break;
		}
		d3.text(filename, 'text/csv', function(text) {
			var thisData = d3.csv.parseRows(text);
			chartFunctions.processData(thisData);		
		});
		chartFunctions.setDefaults();
	},
	highlightPoint:function(){
		var current = $(this), label = current.attr("label");

		/* DISBALES HOVER OVER IN MOTION
		------------------------------------*/
		if (fullMotion === true){
			return;
		}
		else {	
			/* APPEND LABELS AND HIGHLIGHTS
			------------------------------------*/
			var clicked = $("#selection p[label='"+label+"']").attr("clicked");
			if (clicked === "false"){
				//animation
				var $point = $(this), $text = $("#chart text[label='"+ label +"']"), point = d3.select(this);
				point.transition().duration(800).attr("r", 8).ease("elastic");

				/* ADD GUIDING LINES ON HOVER
				------------------------------------*/
				chart.append("g").attr("class", "guide").append("line").attr("x1", point.attr("cx")).attr("x2", 60).attr("y1", point.attr("cy")).attr("y2", point.attr("cy")).style("stroke", colors[colorStep]).transition().delay(200).duration(400).styleTween("opacity",function() { return d3.interpolate(0, .5); }); //x-axis
				chart.append("g").attr("class", "guide").append("line").attr("x1", point.attr("cx")).attr("x2", point.attr("cx")).attr("y1", point.attr("cy")).attr("y2", h - 20).style("stroke", colors[colorStep]).transition().delay(200).duration(400).styleTween("opacity", function() { return d3.interpolate(0, .5); }); //y-axis		
				$point.insertBefore(".axis:eq(0)"); //reorder to front

				//toggle text
				$text.css({visibility:"visible",fill:colors[colorStep]});

				//address color issue
				chartFunctions.processColors('highlight');

				//fill point
				current.css("fill", thisColor);
			}
			//reorganize data based on new positions
			chartFunctions.reprocessData();
		}
	},
	unhightlightPoint:function(){
		var current = $(this), label = current.attr("label");

		/* REMOVE LABELS AND HIGHLIGHTS
		------------------------------------*/
		var clicked = $("#selection p[label='"+label+"']").attr("clicked");
		if (clicked === "false"){				
			//remove label
				current.css("fill", "#e2e2e2");
			//toggle text
				var $text = $("#chart text[label='"+ label +"']");
				$text.css("visibility","hidden");
			//animations
				var point = d3.select(this);	
			//remove tooltip and lines
				$(".guide").remove();
			//restore circle			
				point.transition().duration(800).attr("r", 5).ease("elastic");
			//update positioning
				current.detach().insertBefore("circle:first");
				chartFunctions.reprocessData();
		}			
	},
	updateChart:function(position){	
		currentData = [];
		
		for (i = 0; i < points._wrapped.length; i++) {
			//update plot
			if (initReprocess == false){
				if (dataType === "TeachStudent"){
					currentData[i] = new Array();
					currentData[i][0]  = parseFloat(plotData[i][position][0]);
					currentData[i][1]  = parseFloat(plotData[i][position][1]);
					currentData[i][2]  = plotData[i][position][2];	
				}
				else {		
					currentData[i] = new Array();		
					currentData[i][0]  = parseInt(plotData[i][position][0]);
					currentData[i][1]  = parseInt(plotData[i][position][1]);
					currentData[i][2]  = plotData[i][position][2];					
				}
			}
			else {
				 if (dataType === "TeachStudent"){
					currentData[i] = new Array();
					currentData[i][0]  = parseFloat(updatedPointData[i][position][0]);
					currentData[i][1]  = parseFloat(updatedPointData[i][position][1]);
					currentData[i][2]  = updatedPointData[i][position][2];	
				}
				else {		
					currentData[i] = new Array();		
					currentData[i][0]  = parseInt(updatedPointData[i][position][0]);
					currentData[i][1]  = parseInt(updatedPointData[i][position][1]);
					currentData[i][2]  = updatedPointData[i][position][2];					
				}
			}
		}	

		/* UPDATE YEAR
		------------------------------------*/
		yearPosition = years._wrapped[position];

		/* END MOTION IF END YEAR
		------------------------------------*/
		if (yearPosition == endYear){
			fullMotion = false;
			$('#playMotion').attr("src", "assets/play.png");
			//toggle change in slider
			$('#yearSlider').css('display','block');
			$('.progress').css('display','none');
		}

		/* RECALC LABEL POSITIONS
		------------------------------------*/
		chartFunctions.updateLabels(currentData);

		/* UPDATE CHART DATA
		------------------------------------*/
		chartFunctions.drawChart(currentData);

		/* UPDATE SLIDER
		------------------------------------*/
		$("#yearSlider").attr("value", yearPosition);
		$("#nav-wrapper h2").text(yearPosition);
		//determine progress bar
		if (dataPosition == 0){
			progressBar = 0;
		}
		else {
			progressBar = (dataPosition + 1) * progressStep;
		}
		$('.progress-bar').css('width', progressBar +'%');

		/* REPEAT IF MOTION TRUE
		------------------------------------*/
		if (fullMotion == true){
			//DO IT AGAIN!
			if (dataType === "NAEPexpend" || dataType === "NAEPincome" || dataType === "NAEPpoverty"){
				if (yearPosition === endYear - 2){
					$("#playMotion").attr("src", "assets/play.png");
				}
			}
			else if (yearPosition === endYear - 1){
				$("#playMotion").attr("src", "assets/play.png");
			}
			setTimeout(function(){
				if (dataPosition !== years.length - 1){
					dataPosition = dataPosition + 1;
					chartFunctions.updateChart(dataPosition);
				}
			}, 200)
		}
	},
	updateLabels:function(data){
		/* UPDATE LABEL POSITIONS
		------------------------------------*/	
		chart.selectAll("text").data(data).attr("x", function(d) {return xScale(d[0]) + 5;}).attr("y", function(d) {return yScale(d[1]) - 5;});

		/* UPDATE LABELS
		------------------------------------*/	
		for (i=0 ; i < data.length ; i++){
			points._wrapped[i] = data[i][2];
		}
	},
	processColors:function(direct){
		if (direct === 'add' || direct === 'highlight'){
			var w = 0, whileStatus = true;
			while (w < colorLoops){
				if (whileStatus == true){
					for (i=0 ; i < colors.length ; i++){
						if (colorsInUse[i] == w){
							thisColor = colors[i];
							colorStep = i;
							whileStatus = false;
							if (direct === 'add'){
								colorsInUse[i] += 1;
							}
							break;
						}
					}
					w += 1;
				}
				else {
					break;
				}				
			}
		}
		else {
			colorsInUse[parseInt(direct)] -= 1;
		}
	},
	resetColors:function(){
		$('#selection p[clicked="true"]').click();
		toggledLabels = [];
	},
	populateLabels:function(){
		/* AXIS LABELS
		------------------------------------*/
		$("#x-axis").text(axisLabels.x);
		$("#y-axis").text(axisLabels.y);

		/* POINT LABELS
		------------------------------------*/
		for (i=0 ; i < points._wrapped.length ; i++){
			$("#selection").append("<p label=\""+points._wrapped[i]+"\"clicked=\"false\">" + points._wrapped[i] + "</p>");
			$("#selection p:eq("+i+")").on("click", function(){
				var clicked = $(this).attr("clicked");
				var thisPoint = $(this).text();

				/* PREVENT LABEL CLICK ON MOTION
				------------------------------------*/
				if(fullMotion === true){
					return;
				}
				else{		
					/* TOGGLE LABEL BEHAVIOR
					------------------------------------*/					
					if (clicked === "false"){	
						//address color issue
						chartFunctions.processColors('add');

						//unhide text
						var $text = $("#chart text[label='"+ thisPoint +"']");
						$text.css({visibility:"visible",fill:thisColor});
						$text.insertBefore(".axis:eq(0)");
											
						//background and up front
						$(this).css("background", "#ddd").attr({clicked:"true",color:colorStep});
						$("#chart circle[label='"+ thisPoint +"']").css("fill",thisColor).attr("clicked", "true");
						var index = _.indexOf(points._wrapped, thisPoint);
						toggledLabels.push(index); //push to toggled list
						
						//reorder to front	
						var $point = $("#chart circle[label='"+ thisPoint +"']");
						$point.insertBefore(".axis:eq(0)");
					}
					else {
						//address color issue
						chartFunctions.processColors($(this).attr('color'));

						//background
						$(this).css("background", "#fff").attr("clicked","false");
						$("#chart circle[label='"+ thisPoint +"']").css("fill","#e2e2e2");
						$("#chart circle[label='"+ thisPoint +"']").attr("clicked", "false");

						//remove label
						var $text = $("#chart text[label='"+ thisPoint +"']");
						$text.css("visibility","hidden");

						//remove from toggled list
						var index = _.indexOf(points._wrapped, thisPoint);
						for (i=0;i<toggledLabels.length;i++){
							if (toggledLabels[i] === index){
								delete toggledLabels[i];
								toggledLabels = _.compact(toggledLabels); 
								break;
						}
					}
					}
					//reorganize data based on new positions
					chartFunctions.reprocessData();
				}
			});
		}
		$('#main-wrapper').append('<p id="reset-button" onclick="chartFunctions.resetColors();">RESET</p>');
	},
	reprocessData:function(){
		var curPos = [], tempData = [];

		/* THIS ADDRESSES MOTION ISSUES WHEN MOVING POINTS TO TOP
		-----------------------------------------------------------------*/
		if (initReprocess == false){
			for (i=0 ; i < totalPoints ; i++) {
				// GRAB CURRENT ELEM POSITION
				curElemPos[i] = $("svg circle:eq("+i+")").attr("elem-pos");

				// UPDATE DATA BASED ON CURRENT ELEM POSITION
				tempData[i] = plotData[curElemPos[i]]; 
				updatedPointData[i] = tempData[i];
			};
			initReprocess = true;
		}
		else {
			for (i=0 ; i < totalPoints ; i++) {

				// GRAB CURRENT ELEM POSITION
				curElemPos[i] = $("svg circle:eq("+i+")").attr("elem-pos");

				// UPDATE DATA BASED ON CURRENT ELEM POSITION
				tempData[i] = updatedPointData[curElemPos[i]]; 
			};
			updatedPointData = tempData;
		}

		/* UPDATE POSITION OF ALL ELEMENTS
		------------------------------------*/
		for(i=0 ; i < totalPoints ; i++){
			$("svg circle:eq("+i+")").attr("elem-pos", i);
		}
	},
	processData:function(thisData){
		var tempYears = [], tempLabels = [];
		
		/* GRAB YEARS AND LABELS
		------------------------------------*/
		for (i = 1 ; i < thisData.length ; i++){
			tempYears[i] = parseInt(thisData[i][1]);
			tempLabels[i] = thisData[i][0];
		}
		years = _.chain(tempYears).uniq().compact();
		points = _.chain(tempLabels).uniq().compact();
							
		/* POPULATE SLIDER
		------------------------------------*/
		$("#nav-wrapper h2").text(startYear); //default year
		$("#yearSlider").attr("min", startYear).attr("max", endYear).attr("value", startYear);

		/* GRAB DATA
		------------------------------------*/
		totalPoints = points._wrapped.length;
		for (i = 0 ; i < points._wrapped.length ; i++){
			plotData[i] = new Array();
			var iii = 1 + i;
			for (ii = 0 ; ii < years._wrapped.length ; ii++){
				plotData[i][ii] = new Array();
				plotData[i][ii][0] = thisData[iii][2];
				plotData[i][ii][1] = thisData[iii][3];
				plotData[i][ii][2] = thisData[iii][0];
				iii = iii + totalPoints;
			}
		}
		
		/* GRAB FIRST YEAR IN DATA
		------------------------------------*/
		for (i = 0 ; i < totalPoints ; i++){
			currentData.push(plotData[i][0])
		}
		
		chartFunctions.drawChart(currentData);
		chartFunctions.populateLabels();
		chartFunctions.defaultToggle(dataType);

	},
	drawChart:function(data){
		/* INIT CHART POSITION
		------------------------------------*/
		if (firstRun == true) {

			/* SET SCALES
			------------------------------------*/
			xScale = d3.scale.linear().domain([0, maxX]).range([60, w+xAdjust]).clamp(true).nice(); //xscale				
			yScale = d3.scale.linear().domain([0, maxY]).range([h-padding,padding]).clamp(true).nice(); //yscale

			/* DRAW PLOTS
			------------------------------------*/
			chart.selectAll("circle").data(data).enter().append("circle").attr("class", "plotPoint").attr("cx", function(d){return xScale(d[0]);}).attr("cy", function(d){return yScale(d[1]);}).attr("data-x", function(d){return d[0];}).attr("data-y", function(d){return d[1];}).attr("r", 5).attr("clicked","false").on("mouseover", chartFunctions.highlightPoint).on("mouseleave", chartFunctions.unhightlightPoint);
			
			/* ADD INIT ELEMENT POSITIONS
			------------------------------------*/
			for (i = 0 ; i < totalPoints ; i++){
				$("svg circle:eq("+i+")").attr("elem-pos", i);
			}
			
			/* DRAW LABELS
			------------------------------------*/	
			chart.selectAll("text").data(data).enter().append("text").text(function(d) {return d[2];}).attr("x", function(d) {return xScale(d[0]) + 5;}).attr("y", function(d) {return yScale(d[1]) - 5;}).attr("class", "plotLabels").attr("label", function(d){return d[2];}) //meta data for bars
			for (i=0 ; i < totalPoints ; i++){
				$("#chart circle:eq("+i+")").attr("label", points._wrapped[i]);
			}
			
			/* DEFINE AXES
			------------------------------------*/	
			var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(5); //xaxis
			var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5); //yaxis

			/* CREATE AXES
			------------------------------------*/	
			chart.append("g").attr("class", "axis").attr("transform", "translate(0," + (h - padding) + ")").call(xAxis); //xaxis
			chart.append("g").attr("class", "axis").attr("transform", "translate(" + 60 + ",0)").call(yAxis); //yaxis
			
			

			utilityFunctions.churnLargeNumbers();
			firstRun = false;
		}
		/* ALL OTHER CHART POSITIONS
		------------------------------------*/
		else {

			/* MODIFY PLOTS
			------------------------------------*/	
			chart.selectAll("circle").data(data).attr("class", "plotPoint").transition().attr("cx", function(d){return xScale(d[0]);}).attr("cy", function(d){return yScale(d[1]);}).attr("data-x", function(d){return d[0];}).attr("data-y", function(d){return d[1];}).attr("r", 5);
			for (i=0 ; i < totalPoints ; i++){
				$("#chart circle:eq("+i+")").attr("label", points._wrapped[i]);
			}
		}
	}
}


/* DETERMINES SPECIFIC CHART ONLOAD AND ADDS CUSTOMIZATION
===================================================================================*/
chartFunctions.grabData();


/* ADDRESS CHART MOTION
===================================================================================*/
$(document).ready(function(){
	$("#playMotion").on("click", function(){
		if (fullMotion == false){
			if (yearPosition == endYear){
				dataPosition = 0;
			}
			fullMotion = true;
			$(this).attr("src","assets/pause.png");
			chartFunctions.updateChart(dataPosition);
			//toggle change in slider
			$('#yearSlider').css('display','none');
			$('.progress').css('display','block');
		}
		else {
			fullMotion = false; //pause motion
			//toggle change in slider
			$('#yearSlider').css('display','block');
			$('.progress').css('display','none');
		}
	}).on("mouseover", function(){ 
		if (fullMotion == true){
			$(this).attr("src", "assets/pause-hover.png");
		}
		else {
			$(this).attr("src", "assets/play-hover.png");
		}
	}).on("mouseleave", function(){
		if (fullMotion == true){
			$(this).attr("src", "assets/pause.png");
		}
		else {
			$(this).attr("src", "assets/play.png");
		}
	});

	$("#reloadChart").on("click", function(){
		if (fullMotion == true){
			fullMotion = false;	//stops motion				
			$("#playMotion").attr("src", "assets/play.png");
			setTimeout(function(){
				dataPosition = 0
				chartFunctions.updateChart(dataPosition);
			},500);	
		}
		else if (dataPosition > 0){
			dataPosition = 0
			chartFunctions.updateChart(dataPosition);
		}
	}).on("mouseover", function(){
		$(this).attr("src", "assets/reload-hover.png");
	}).on("mouseleave", function(){
		$(this).attr("src", "assets/reload.png");

	});
});