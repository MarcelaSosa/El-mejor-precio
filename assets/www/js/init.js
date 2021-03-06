$(document).ready(function(){
	Zepto(function($){
		get_location();
		uiPageSet();
	})
	//$(document.body).transition('options', {defaultPageTransition : 'flip', domCache : true})
	this.el.on('click', '.add-location-btn', this.addLocation);
	
});
/*
this.addLocation = function(event) {
    event.preventDefault();
    console.log('addLocation');
    navigator.geolocation.getCurrentPosition(
        function(position) {
            $('.location', this.el).html(position.coords.latitude + ',' + position.coords.longitude);
        },
        function() {
            alert('Error getting location');
        });
    return false;
};
*/
var MELI_URL = "https://api.mercadolibre.com";
var query;
var queryResults;
var offset = 0;
var limit = 0;
var lowestPrice;
var maximumPrice;
var distance;
var itemsShown = {};
var userPoint = {};
var states = new Array();
var condition = 'new';
//stateId = "AR-C";
var filterState;

function uiPageSet() {
	wHeight = $('.page').height()
	$('.page').height(wHeight);
	hHeight = $('.home').height();
	$('.home').css('padding-top', (((wHeight-hHeight)/2)/2))
	$('.ch-loading-wrap').hide();
}
$.fn.enterKey = function (fnc) {
    return this.each(function () {
        $(this).keypress(function (ev) {
            var keycode = (ev.keyCode ? ev.keyCode : ev.which);
            if (keycode == '13') {
                fnc.call(this, ev);
            }
        })
    })
}

function login() {
	var ID = '3749919784786933';
	//var ID = '294774893634062';
	
	MELI.init({client_id: ID});
	
	MELI.login(function() {
		debugger;
		MELI.get('users/me',null,function(data){
		});

	});
};
function get_location() {
	navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
}
function geoSuccess(point) {
	userPoint.latitude = point.coords.latitude;
	userPoint.longitude = point.coords.longitude;
	/*eliminar*/
	//userPoint.latitude = '-31.3526556'; 
	//userPoint.longitude = '-64.2460254';
	
	loadCountries();
}
function geoError() {
	navigator.notification.alert(
		'Intenta activar tu GPRS o conectarse a una red movil.',      // (message)
		alertDismissed,         										// (alertCallback)
		'No podemos encontrar tu ubicaci\u00f3n',            							// (title)
		'Ok'                											// (buttonName)
	);
}
function doGet(pathUrl, callback, asynch) {
	if (!asynch) {
		asynch = false;
	}
	$.ajax({
		type: 'GET',
		url: pathUrl,
		dataType: 'json',
		async: asynch,
		success:callback,
		error: function(xhr, type){
			navigator.notification.alert(
				'Intenta activar tu conexi\u00f3n a una red movil o WiFi.',      // (message)
				alertDismissed,         										// (alertCallback)
				'No tiene conexi\u00f3n a una red!',            							// (title)
				'Ok'                											// (buttonName)
			);
		}
	})
};
function categoriesList() {
	doGet(MELI_URL+'/sites/MLA/categories', categorieSet);
}
function loadCountries() {
	doGet('./statesJson.txt', locationSet);
	loadDropStates();
}

function locationSet(data) {
	nearestState = data[0];
	var nearestCity = data[0].cities[0];
	nearestCity.distance = getModule(nearestCity, userPoint);
	
	for (var i=1; i < data.length; i++) {
		var state = {};
		state.name = data[i].name;
		state.id = data[i].id;
		states[i-1] =  state;
		for (var j=0; j < data[i].cities.length; j++) {
			cityAux = data[i].cities[j];
			cityAux.distance = getModule(cityAux, userPoint);
			if (nearestCity.distance > cityAux.distance) {
				nearestCity = cityAux;
				nearestState = data[i];
				stateId = nearestState.id;
				filterState ='&state='+stateId;
				break;
			}        
		}
	}
}
function getNearestCity(states) {
	var nearestCity = states[0].cities[0];
	for (var i=0; i < states.length; i++) {
	    for (var j=0; j < states[i].cities.length; j++) {
	        if (nearestCity.distance > states[i].cities[j].distance) {
	            nearestCity = states[i].cities[j];
	        }        
	    }
	}
	return nearestCity;
}

function countriesSet(data) {
	var statesML = data.states;
	var states = new Array(statesML.length);
	for (var i=0; i< statesML.length; i++) {
		state = {};
		state.name = statesML[i].name;
		state.id = statesML[i].id;
		state.cities;
		doGet(MELI_URL+'/states/'+state.id, citieSet);
		states[i] = state;
	}
	var min = states[0].cities[0];
	for (var i=0; i < states.length; i++) {
	    for (var j=0; j < states[i].cities.length; j++) {
	        if (min.distance > states[i].cities[j].distance) {
	            min = states[i].cities[j];
	        }        
	    }
	}
	$('.content').append(states)
}
function citieSet(data) {
	state.cities = data.cities;
	for (var i=0; i< data.cities.length; i++) {
		var city= {};
		city.name = state.cities[i].name;
		city.id = state.cities[i].id;
		city.latitude;
		city.longitude;
		city.stateName;
		city.stateId;
		doGet(MELI_URL+'/cities/'+city.id, citieDataSet);
		city.distance = getModule(city,userPoint);
		state.cities[i] = city;
	}
}
function citieDataSet(data) {
	var geo_information = data.geo_information;
	if (geo_information != null) {
		city.latitude = geo_information.location.latitude;
		city.longitude = geo_information.location.longitude;
	}
	city.stateName = data.state.name;
	city.stateId = data.state.id;
}

function getModule(city, userPoint) {
	return	Math.sqrt(Math.pow((userPoint.latitude-city.latitude),2) + Math.pow((userPoint.longitude-city.longitude),2));
}

function alertDismissed() {
    // action
}


$(".search-btn").click(function () {
	smallLoadin(1);
	search()
})
$(".labelSearch").enterKey(function () {
	setTimeout(smallLoadin(1),100);
	search();
});
$('.inter-search-btn').enterKey(function () {
	smallLoadin(1);
	query = $('.interLabelSearch').val().replace(' ','%20');
	searchQuery();
});
$('.interLabelSearch').enterKey(function () {
	query = $('.interLabelSearch').val().replace(' ','%20');
	searchQuery();
	cloneDropStates()
});
function cloneDropStates() {
	var dropStates = $('.btn-geolocation').html();
	$('.header').append(dropStates);
}
function search() {
	query = $('.labelSearch').val().replace(' ','%20');
	var control = searchQuery();
	if (control != false) {
		setTimeout('getPage(index , productList)',1000);
	}else{
		msg();
		smallLoadin(0);
		$('.labelSearch').val("");
	}
}
function getPage(current, nextPage) {
	$(current).removeClass('active');
	$(nextPage).addClass('active');
}

function loadDropStates(){
	var obj = {};
	obj.states = states;
	var statesData = $('.tmp-states').html();
	$('.btn-geolocation').html(Mustache.render( statesData, obj));
	var optionSelect = '.btn-geolocation #'+stateId;
	$(optionSelect).attr('selected','selected');
};
$(".btn-geolocation").on('change', function(){
	stateId = this.value;
	filterState ='&state='+stateId;
});
$('.close-modal').click(function() {
	$(this).parent().hide();
});

function searchQuery() {
	var standardDeviation = getPrices();
	lowestPrice = Math.abs(standardDeviation.media-standardDeviation.deviation);
	maximumPrice = Math.abs(standardDeviation.media+standardDeviation.deviation);
	if (standardDeviation.results == 0) {
		var actionPage = false;
		return actionPage;
	}else{
		offset = 0;
		limit = 5;
		loadSearchQuery(renderResultsSet);	
	}
}
function msg() {
	$('.ch-msg-wrap').show().animate({opacity: 1});
	setTimeout(function() {
		$('.ch-msg-wrap').animate({opacity: 0}).show();
	},2000);
	
	
}
function getPrices() {
	var retVal = {};
	doGet(MELI_URL+'/sites/MLA/search?q='+ query +filterState+'&condition='+condition,
		function(data) {
			var n = data.results.length;
			var add = 0;
			var desviacionDato;
			for (var i=0; i< n; i++) {
				add+= data.results[i].price;
			}
			var media = add/n;
			add = 0;
			for (var i=0; i< n;) {
				add+= Math.pow(data.results[i].price-media, 2 )
				i++;
			}
			if (add != 0) {
				desviacionDato = Math.sqrt(add/(n-1))
			}else{
				desviacionDato = 0;
			}
			retVal.results = n;
			retVal.deviation = desviacionDato;
			retVal.media = media;
		}
	);
	return retVal;
}
function loadSearchQuery(renderSet) {
	doGet(MELI_URL+'/sites/MLA/search?q='+query+filterState+'&condition='+condition+'&sort=price_asc&price='+lowestPrice+'-'+maximumPrice+'&offset='+offset+'&limit='+limit, renderSet);
}
function renderResultsSet(data){
	addItemsToHash(data.results);
	queryResults = $(".tmp-item").html();
	$(".products").html('');
	$(".products").html(Mustache.render( queryResults, data))
	$(".products li").show();
	smallLoadin(0);
}
function renderAddResultsSet(data){
	var lastItem = data.paging.total-data.paging.offset;
	if (lastItem >= 0) {
		addItemsToHash(data.results);
		$(".products").append(Mustache.render( queryResults, data));
		$(".products li").show();
	}else{
		i = limit;
		$('.products').after('<p class="ch-box-information">Oops! No tenemos mas productos relacionados con <b>"'+query.replace('%20',' ')+'"</b></p>');
	}
}
function addItemsToHash(items) {
	for (var i=0; i < items.length; i++) {
		if ( items[i].condition == "new" ) {
			items[i].condition = "nuevo";
		}else{
			items[i].condition = "usado";
		}
		itemsShown[items[i].id] = items[i];
	}
}
function viewItem(obj) {
	getPage(productList, productDetails);
	var itemData = $('.tmp-details').html();
	var itemTitle = $('.tmp-title-product').html();
	$('.item-details').html(Mustache.render( itemData, itemsShown[obj.id]));
	$('.product-info').html(Mustache.render( itemTitle ,itemsShown[obj.id]) );
	doGet(MELI_URL+'/items/'+obj.id, imagesCarouselSet, true);
}
function imagesCarouselSet(data) {
	var carouselTmp = $('.tmp-carousel').html();
	$('.slide').html(Mustache.render( carouselTmp, data));
	carouselSet(data.pictures.length);
}
function carouselSet(index) {
	var sliderWidth = ($(window).width()/100)*60;
	var paddingSlider = ($('.ch-carousel ul li').css('padding').replace('px',''))*2;
	var totalWidth = (sliderWidth+paddingSlider)*index;
	var limit = totalWidth - (sliderWidth+paddingSlider);
	$('.ch-carousel').width(sliderWidth)
	$('.ch-carousel ul').width(totalWidth);
	$('.ch-carousel ul li').width(sliderWidth);
	$('.ch-carousel-next').show();
	
	$('.ch-carousel-next').click(function(){
		position = $('.ch-carousel ul').css('left').replace('px','');
		if (position != (-limit)) {
			var moveNext= (position*1)-(sliderWidth+paddingSlider);
			$('.ch-carousel-prev').show();
			$('.ch-carousel ul').animate({
				left: (moveNext)+'px'
			}, 500);	
		}else{
			$('.ch-carousel-next').hide();
		}
	});
	$('.ch-carousel-prev').click(function(){
		position = $('.ch-carousel ul').css('left').replace('px','');
		if (position != '0') {
			var movePrev= (position*1)+(sliderWidth+paddingSlider);
			$('.ch-carousel-next').show();
			$('.ch-carousel ul').animate({
				left: movePrev+'px'
			}, 500);	
		}else{
			$('.ch-carousel-prev').hide();
		}
		
	});	
	
	$('.ch-carousel').swipeRight(function(){
		position = $('.ch-carousel ul').css('left').replace('px','');
		if (position != (-limit)) {
			var moveNext= (position*1)-(sliderWidth+paddingSlider);
			$('.ch-carousel-prev').show();
			$('.ch-carousel ul').animate({
				left: (moveNext)+'px'
			}, 500);	
		}else{
			$('.ch-carousel-next').hide();
		}
	});
	$('.ch-carousel').swipeLeft(function(){
		position = $('.ch-carousel ul').css('left').replace('px','');
		if (position != '0') {
			var movePrev= (position*1)+(sliderWidth+paddingSlider);
			$('.ch-carousel-next').show();
			$('.ch-carousel ul').animate({
				left: movePrev+'px'
			}, 500);	
		}else{
			$('.ch-carousel-prev').hide();
		}
		
	});	
	
	
	
}
$('.back-list').click(function(){
	getPage(productDetails, productList);
});
$('.go-home').click(function(){
	getPage(productList, index);
	$('.labelSearch').val('');
});
$('.used').click(function(){
	condition = 'used';
	smallLoadin(1);
	$('.new').removeClass('active');
	$('.used').addClass('active');	
	searchQuery();
});
$('.new').click(function(){
	condition = 'new';
	smallLoadin(1);
	$('.used').removeClass('active');
	$('.new').addClass('active');	
	searchQuery();
});
function smallLoadin(value) {
	$('.ch-loading-small').animate({
		opacity: value
	});
}
function goProduct(url){
	location.href=url;
}
function loadItems() {
	offset=offset+5;
	loadSearchQuery(renderAddResultsSet);
}











