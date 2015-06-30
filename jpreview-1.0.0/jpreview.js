/*!
 * jQuery Plugin: jpreview.js v1.0.0
 *
 * Copyright (c) 2015 Jimmy Tsai
 */
(function($) {
	var draggerDefaults = {
        'dragger': 'dragger',
        'draggerDragging': 'dragging',
        'initX':'',
        'initY':''
	};
	var resizerDefaults = {
        'resizer': 'resizer',
        'resizerContent': 'resizer-content',
        'resizerControl': 'resizer-control',
        'resizerResizing': 'resizing',
        'resizerEast':'resizer-e',
        'resizerSouth':'resizer-s',
        'resizerWest':'resizer-w',
        'resizerNorth':'resizer-n',
        'resizerNE':'resizer-ne',
        'resizerSE':'resizer-se',
        'resizerSW':'resizer-sw',
        'resizerNW':'resizer-nw',
        'minWidth': '20',
        'minHeight': '20',
        'enableEast': true,
        'enableSouth': true,
        'enableWest': true,
        'enableNorth': true,
        'enableNE': true,
        'enableSE': true,
        'enableSW': true,
        'enableNW': true,
        'aspectRatio': false,
        'initWidth': '',
        'initHeight': ''
	};
    var cropperDefaults = {
        'cropperWrap':'cropper',
        'cropperBorder':'cropper-border',
        'ratio': '1',
        'width': '',
        'height': '',
        'borderRatio':'1',
        'borderWidth':'',
        'borderHeight':'',
    };
	var previewDefaults = {
        'uploaderAttr': '',
        'maxPrevImgs': 'nolimit',
        'editRatio': '1',
        'edit': true,
        'triggerEdit': 'click',
        'removeEdit': 'contextmenu',
        'exchange': false,
        'prevWrapper': 'prev-wrapper',
        'prevImg': 'prev-img',
        'prevImgRatio':'1',
        'prevImgWidth':'',
        'prevImgHeight':'',
        'prevWrapRatio':'1',
        'prevWrapWidth':'',
        'prevWrapHeight':'',
        'confineInWrap': false
	};
    var dndDefaults = {
        'customEvent': 'filesdropped',
        'handle': ''
    };
	function getPixel(number) {
        if ( (typeof number) === 'number' ) {
            return (number.toString() + 'px');
        } else if ( (typeof number) === 'string' ) {
            return (number + 'px');
        } else {
            return '0px';
        }
    };
	function getClass(str) {
        return '.' + str;
	};
    function setLayout(target, pos, size){
        target.offset({
            'left': pos.x,
            'top': pos.y
        });
        target.css({
            'width': getPixel(size.width),
            'height': getPixel(size.height),
        });
    };
    function getPos(target, x, y) {
        var pos = {'x':'nodefined', 'y':'nodefined'};
        if ( (typeof x !== 'undefined') && (typeof y !== 'undefined') && ( x !== '' ) && ( y !== '' ) && ( !isNaN(parseFloat(x)) ) && ( !isNaN(parseFloat(y)) ) ){
            pos.x = parseFloat(x);
            pos.y = parseFloat(y);
        } else {
            pos.x = target.offset().left;
            pos.y = target.offset().top;
        }
        return pos;
    };
    function getSize(target, width, height) {
        var size = {'width':'nodefined', 'height':'nodefined'};
        if ( (typeof width !== 'undefined') && (typeof height !== 'undefined') && ( width !== '' ) && ( height !== '' ) && ( !isNaN(parseFloat(width)) ) && ( !isNaN(parseFloat(height)) ) ){
            size.width = parseFloat(width);
            size.height = parseFloat(height);
        } else {
            size.width = target[0].width;
            size.height = target[0].height;
        }
        return size;
    };
    function rescale(wlimit, hlimit, wori, hori) {
        var wl = parseFloat(wlimit),
            hl = parseFloat(hlimit),
            wo = parseFloat(wori),
            ho = parseFloat(hori),
            ratio,
            size = {};
        if ( !isNaN(wl) && !isNaN(hl) && !isNaN(wo) && !isNaN(ho) ) {
            if ( less(wo, wl) && less(ho, hl) ){
                size.w = wo;
                size.h = ho;
            } else if ( less(wo, wl) && !less(ho, hl) ) {
                ratio = ho/hl;
                size.w = wo/ratio;
                size.h = hl;
            } else if ( !less(wo, wl) && less(ho, hl) ) {
                ratio = wo/wl;
                size.w = wl;
                size.h = ho/ratio;
            } else if ( !less(wo, wl) && !less(ho, hl) ) {
                ratio = wo/wl > ho/hl ? wo/wl : ho/hl;
                size.w = wo/ratio;
                size.h = ho/ratio;
            }
        } else {
            size.w = 0;
            size.h = 0;
        }
        return size;
        function less(a, b){
            return (a <= b ? true:false) ;
        };
    };
    function writeCropData(target, ratio, bw, bh, iw, ih, sx, sy){
        ratio = parseFloat(ratio);
        bw = parseFloat(bw);
        bh = parseFloat(bh);
        iw = parseFloat(iw);
        ih = parseFloat(ih);
        sx = parseFloat(sx);
        sy = parseFloat(sy);
        target.attr('crop-data', '{' + '"borderRatio":' + ratio + ',"borderWidth":' + bw + ',"borderHeight":' + bh + ',"width":' + iw + ',"height":' + ih + ',"shiftX":' + sx + ',"shiftY":' + sy + '}');
    }
    function writeInitSize(target, width, height) {
        var w = parseFloat(width), h = parseFloat(height);
        target.attr('init-size', '{'+ '"width":' + w + ',"height":' + h + '}');
    };
    function processSize( _cf, _wr, _ww, _wh, _ir, _iw, _ih, _imgWidth, _imgHeight ){
        var cf = _cf,
            wr = parseFloat(_wr),
            ww = parseFloat(_ww),
            wh = parseFloat(_wh),
            ir = parseFloat(_ir),
            iw = parseFloat(_iw),
            ih = parseFloat(_ih),
            imgSize = {'w':0, 'h':0},
            bothSize = {'ww':0, 'wh':0, 'iw':0, 'ih':0};
        wr = ( !isNaN(wr) ) ? wr : 1;
        ir = ( !isNaN(ir) ) ? ir : 1;
        imgWidth = parseFloat(_imgWidth);
        imgHeight = parseFloat(_imgHeight);
        if (  isNaN(imgWidth) || isNaN(imgHeight) ) {
            console.log('case 0: initial imgWidth or imgHeight not defined');
            return;
        }
        if ( !isNaN(ww) && !isNaN(wh) ){
            if ( ( (typeof cf) === 'boolean' ) && ( cf === true ) ) {
                //console.log('case1');
                imgSize = rescale(ww, wh, imgWidth, imgHeight);
            } else {
                if ( !isNaN(iw) && !isNaN(ih) ){
                    //console.log('case2');
                    imgSize.w = iw;
                    imgSize.h = ih;
                } else {
                    //console.log('case3');
                    imgSize.w = imgWidth*ir
                    imgSize.h = imgHeight*ir
                }
            }
            bothSize.ww = ww;
            bothSize.wh = wh;
            bothSize.iw = imgSize.w;
            bothSize.ih = imgSize.h;
        } else { // no confine in this case
            if ( !isNaN(iw) && !isNaN(ih) ){
                //console.log('case4');
                bothSize.iw = iw;
                bothSize.ih = ih;
            } else {
                //console.log('case5');
                bothSize.iw = imgWidth*ir
                bothSize.ih = imgHeight*ir
            }
            bothSize.ww = bothSize.iw*wr;
            bothSize.wh = bothSize.ih*wr;
        }
        return bothSize;
    };
	$.extend($.fn, {
		drag: function(options) {
			var settings = $.extend(true, {}, resizerDefaults, draggerDefaults, options),
                target = $(this);
            var tagName = target.prop('tagName').toLowerCase();
            var dragger;
            if ( tagName !== 'img' ) {
                dragger = target;
            } else if ( tagName === 'img') {
                var pos = getPos(target, settings.initX, settings.initY),
                    size = getSize(target);
                var isParentDiv = target.parent().is('div');
                var isParentResizer = target.parent().hasClass( settings.resizer );
                if ( !( isParentDiv && isParentResizer) ) {
                    target.wrap('<div class="' + settings.dragger + '"></div>');
                }
                dragger = target.parent();
                dragger.css({
                    'padding': '0'
                });
                setLayout(dragger, pos, size);
            }
            dragger.addClass(settings.dragger);
            dragger.on('mousedown', function(e){
                startDrag(e, $(this));
            });
            function startDrag(e, dragger) {
                e.preventDefault();
                e.stopPropagation();
                var x = e.clientX;
                var y = e.clientY;
                var left = dragger.offset().left;
                var top = dragger.offset().top;
                dragger.on('mousemove', function(e){ 
                    dragging(e, dragger, x, y, left, top);
                });
                dragger.on('mouseup', function(e){
                    endDrag(e, dragger);
                });
            };
            function dragging(e, dragger, x, y, left, top) {
                e.preventDefault();
                e.stopPropagation();
                var _x = e.clientX;
                var _y = e.clientY;
                dragger.addClass(settings.draggerDragging);
                dragger.offset({
                    'left': _x -  x + left,
                    'top': _y -  y + top 
                });
            };
            function endDrag(e, dragger) {
                e.preventDefault();
                dragger.removeClass(settings.draggerDragging);
                dragger.off('mouseup');
                dragger.off('mousemove');
            };
            
		},
		resize: function(options) {
            var settings = $.extend(true, {}, resizerDefaults, draggerDefaults, cropperDefaults, options),
                target = $(this);
			var tagName = target.prop('tagName').toLowerCase();
			var resizer;
			if ( tagName !== 'img' ) {
                resizer = target;
                resizer.addClass(settings.resizer);
                addResizerControl(settings, resizer);
                setResizerControl(settings, resizer);
                resizer.on('mousedown', getClass(settings.resizerControl) , function(e){
                    startResize(e, resizer, settings, $(this));
                });
			} else if ( tagName === 'img') {
                var pos = getPos(target),
                    size = getSize(target, settings.initWidth, settings.initHeight);
                target.attr('init-size', JSON.stringify( size ) );
                var isParentDiv = target.parent().is('div');
                var isParentDragger = target.parent().hasClass( settings.dragger );
                if ( !( isParentDiv && isParentDragger) ) {
                    target.wrap('<div class="' + settings.resizer + '"></div>');
                }
                resizer = target.parent();
                resizer.addClass(settings.resizer);
                setResizerImage(resizer, target, settings, pos);
			}
            function setResizerImage(resizer, img, settings, pos){
                var initSize = JSON.parse( img.attr('init-size') );
                resizer.offset({
                    'left': pos.x,
                    'top': pos.y,
                });
                resizer.css({
                    'width': getPixel(initSize.width),
                    'height': getPixel(initSize.height),
                    'padding': '0'
                });
                img.offset({
                    'left': pos.x,
                    'top': pos.y,
                });
                img.css({
                    'width': getPixel(initSize.width),
                    'height': getPixel(initSize.height),
                });
                img.addClass(settings.resizerContent);
                addResizerControl(settings, resizer);
                setResizerControl(settings, resizer);
                resizer.on('mousedown', getClass(settings.resizerControl) , function(e){
                    startResize(e, resizer, settings, $(this));
                });
            };
            function addResizerControl(settings, resizer) {
                resizer.append('<div class="' + settings.resizerControl + ' ' + settings.resizerEast + '"></div>')
                .append('<div class="' + settings.resizerControl + ' ' + settings.resizerSouth + '"></div>')
                .append('<div class="' + settings.resizerControl + ' ' + settings.resizerWest + '"></div>')
                .append('<div class="' + settings.resizerControl + ' ' + settings.resizerNorth + '"></div>')
                .append('<div class="' + settings.resizerControl + ' ' + settings.resizerNE + '"></div>')
                .append('<div class="' + settings.resizerControl + ' ' + settings.resizerSE + '"></div>')
                .append('<div class="' + settings.resizerControl + ' ' + settings.resizerSW + '"></div>')
                .append('<div class="' + settings.resizerControl + ' ' + settings.resizerNW + '"></div>');
            };
            function setResizerControl(settings, resizer) {
                var w = 10, h = 10;
                resizer.find( getClass(settings.resizerControl) ).css({
                    'position': 'absolute',
                    'width': getPixel(w),
                    'height': getPixel(h),
                    'background-color': '#00d0d1',
                    'z-index': '90'
                });
                resizer.find( getClass(settings.resizerEast) ).css({
                    'right': '0px',
                    'top': '50%',
                    'margin-top': getPixel(-h/2)
                });
                resizer.find( getClass(settings.resizerSouth) ).css({
                    'left': '50%',
                    'bottom': '0px',
                    'margin-left': getPixel(-w/2)
                });
                resizer.find( getClass(settings.resizerWest) ).css({
                    'left': '0px',
                    'top': '50%',
                    'margin-top': getPixel(-h/2)
                });
                resizer.find( getClass(settings.resizerNorth) ).css({
                    'left': '50%',
                    'top': '0px',
                    'margin-left': getPixel(-w/2)
                });
                resizer.find( getClass(settings.resizerNE) ).css({
                    'right': '0px',
                    'top': '0px',
                });
                resizer.find( getClass(settings.resizerSE) ).css({
                    'right': '0px',
                    'bottom': '0px'
                });
                resizer.find( getClass(settings.resizerSW) ).css({
                    'left':'0px',
                    'bottom': '0px'
                });
                resizer.find( getClass(settings.resizerNW) ).css({
                    'left':'0px',
                    'top': '0px'
                });
            };
            function startResize(e, resizer, settings, ctrl) {
                e.preventDefault();
                e.stopPropagation();
                var x = e.clientX;
                var y = e.clientY;
                var left = resizer.offset().left;
                var top = resizer.offset().top;
                var content = '', width, height;
                if ( resizer.find( getClass(settings.resizerContent) ).length > 0 ) {
                    content = resizer.find( getClass(settings.resizerContent) );
                    width = parseFloat(content.css('width').replace('px', ''));
                    height = parseFloat(content.css('height').replace('px', ''));
                } else {
                    width = parseFloat(resizer.css('width').replace('px', ''));
                    height = parseFloat(resizer.css('height').replace('px', ''));
                }
                $(document).on('mousemove', function(e){
                    resizing(e, resizer, settings, ctrl, x, y, left, top, width, height, content);
                });
                $(document).on('mouseup', function(e){
                    endResize(e, resizer, ctrl);
                });
            };
            function resizing(e, resizer, settings, ctrl, x, y, left, top, width, height, content){
                e.preventDefault();
                e.stopPropagation();
                resizer.addClass( settings.resizerResizing );
                var geo = getGeometry(e, resizer, settings, ctrl, x, y, left, top, width, height);
                resizer.offset({
                    'left': geo.left,
                    'top': geo.top 
                });
                resizer.css('width', getPixel(geo.width) );
                resizer.css('height', getPixel(geo.height) );
                if ( content !== '' ) {
                    content.css('width', getPixel(geo.width) );
                    content.css('height', getPixel(geo.height) );
                }
            };
            function getGeometry(e, resizer, settings, ctrl, x, y, left, top, width, height) {
                var geo = {}, tmpW, tmpH, rightLimit, bottomLimit, deltaX, deltaY;
                if ( ctrl.hasClass(settings.resizerEast) ) {
                    tmpW = width + ( e.clientX - x );
                    geo.width = tmpW < settings.minWidth ? settings.minWidth : tmpW;
                    geo.height = height;
                    geo.left = left;
                    geo.top = top;
                } else if ( ctrl.hasClass(settings.resizerSouth) ) {
                    tmpH = height + ( e.clientY - y );
                    geo.width = width;
                    geo.height = tmpH < settings.minHeight ? settings.minHeight : tmpH;
                    geo.left = left;
                    geo.top = top;
                } else if ( ctrl.hasClass(settings.resizerWest) ) {
                    tmpW = width - ( e.clientX - x );
                    rightLimit = left + width - settings.minWidth;
                    deltaX = x - left;
                    geo.width = tmpW < settings.minWidth ? settings.minWidth : tmpW;
                    geo.height = height;
                    geo.left = (e.clientX - deltaX) > rightLimit ? rightLimit : (e.clientX - deltaX);
                    geo.top = top;
                } else if ( ctrl.hasClass(settings.resizerNorth) ) {
                    tmpH = height - ( e.clientY - y );
                    bottomLimit = top + height - settings.minHeight;
                    deltaY = y - top;
                    geo.width = width;
                    geo.height = tmpH < settings.minHeight ? settings.minHeight : tmpH;
                    geo.left = left;
                    geo.top = (e.clientY - deltaY) > bottomLimit ? bottomLimit : (e.clientY - deltaY);
                } else if ( ctrl.hasClass(settings.resizerNE) ) {
                    tmpW = width + ( e.clientX - x ); 
                    tmpH = height - ( e.clientY - y );
                    bottomLimit = top + height - settings.minHeight;
                    deltaY = y - top;
                    geo.width = tmpW < settings.minWidth ? settings.minWidth : tmpW;
                    geo.height = tmpH < settings.minHeight ? settings.minHeight : tmpH;
                    geo.left = left;
                    geo.top = (e.clientY - deltaY) > bottomLimit ? bottomLimit : (e.clientY - deltaY);
                } else if ( ctrl.hasClass(settings.resizerSE) ) {
                    tmpW = width + ( e.clientX - x ); 
                    tmpH = height + ( e.clientY - y );
                    geo.width = tmpW < settings.minWidth ? settings.minWidth : tmpW;
                    geo.height = tmpH < settings.minHeight ? settings.minHeight : tmpH;
                    geo.left = left;
                    geo.top = top;
                } else if ( ctrl.hasClass(settings.resizerSW) ) {
                    tmpW = width - ( e.clientX - x ); 
                    tmpH = height + ( e.clientY - y );
                    rightLimit = left + width - settings.minWidth;
                    deltaX = x - left;
                    geo.width = tmpW < settings.minWidth ? settings.minWidth : tmpW;
                    geo.height = tmpH < settings.minHeight ? settings.minHeight : tmpH;
                    geo.left = (e.clientX - deltaX) > rightLimit ? rightLimit : (e.clientX - deltaX);
                    geo.top = top;
                } else if ( ctrl.hasClass(settings.resizerNW) ) {
                    tmpW = width - ( e.clientX - x ); 
                    tmpH = height - ( e.clientY - y );
                    rightLimit = left + width - settings.minWidth;
                    deltaX = x - left;
                    bottomLimit = top + height - settings.minHeight;
                    deltaY = y - top;
                    geo.width = tmpW < settings.minWidth ? settings.minWidth : tmpW;
                    geo.height = tmpH < settings.minHeight ? settings.minHeight : tmpH;
                    geo.left = (e.clientX - deltaX) > rightLimit ? rightLimit : (e.clientX - deltaX);
                    geo.top = (e.clientY - deltaY) > bottomLimit ? bottomLimit : (e.clientY - deltaY);
                } else {
                    return;
                }
                return geo;
            };
            function endResize(e, resizer, ctrl){
                e.preventDefault();
                resizer.removeClass(settings.resizerResizing);
                $(document).off('mouseup');
                $(document).off('mousemove');
            };
		},
		crop: function(options) {
            var settings = $.extend(true, {}, draggerDefaults, resizerDefaults, cropperDefaults, options);
            var target = $(this), dragger, cropper, border, btn, cropData, pos, size, bs, bothSize;
            var withInitSize = (typeof target.attr('init-size')) === 'undefined' ? false : true;
                withCropData = (typeof target.attr('crop-data')) === 'undefined' ? false : true;
            if ( !target.is('img') ) {
                return;
            }
            if ( !( withCropData && withInitSize ) ) {
                bothSize = processSize( settings.confineInWrap, settings.borderRatio, settings.borderWidth, settings.borderHeight, settings.ratio, settings.width, settings.height, target[0].width, target[0].height );
                pos = getPos(target, settings.initX, settings.initY);
                writeInitSize(target, bothSize.iw, bothSize.ih);
                writeCropData(target, settings.borderRatio, bothSize.ww, bothSize.wh, bothSize.iw, bothSize.ih, 0, 0);
            } else {
                var tmp = JSON.parse( target.attr('init-size') ),
                    offsetX = target.closest('.editor-overlay').width()/2,
                    offsetY = target.closest('.editor-overlay').height()/2;
                pos = getPos(target, offsetX-parseFloat(tmp.width)/2, offsetY-parseFloat(tmp.height)/2);
            }
            cropData = JSON.parse( target.attr('crop-data') );
            settings.initX = pos.x + parseFloat(cropData.shiftX);
            settings.initY = pos.y + parseFloat(cropData.shiftY);
            settings.initWidth = cropData.width;
            settings.initHeight = cropData.height;
            bs = {'width': cropData.borderWidth, 'height':cropData.borderHeight};
            target.wrap('<div class="' + settings.cropperWrap + '"></div>').before('<div class="' + settings.cropperBorder + '"></div>');
            cropper = target.parent();
            border = target.prev();
            setLayout(cropper, pos, bs);
            setLayout(border, pos,  bs);
            setElementStyle(border);
            target.drag(settings);
            target.resize(settings);
            function setElementStyle(border){
                border.css({
                    'position': 'absolute',
                    'left': '0',
                    'top': '0',
                    'z-index': '999',
                    'border': 'solid 1px rgba(222,60,80,.9)',
                    'box-sizing': 'content-box',
                    'pointer-events': 'none'
                });
            };
		},
        getCropResult: function(options){
            var target = $(this);
            var settings = $.extend(true, {}, draggerDefaults, resizerDefaults, cropperDefaults, options);
            var result = {}, cropper = target.parent().parent();
            if ( target.is('img') && cropper.hasClass(settings.cropperWrap) )  {
                var border = cropper.find( getClass(settings.cropperBorder) );
                var dragger = cropper.find( getClass(settings.dragger) );
                result.borderRatio = settings.borderRatio;
                result.borderWidth = border.width();
                result.borderHeight = border.height();
                result.width = target[0].width;
                result.height = target[0].height;
                result.shiftX = target.offset().left - border.offset().left;
                result.shiftY = target.offset().top - border.offset().top;
                writeCropData(target, result.borderRatio, result.borderWidth, result.borderHeight, result.width, result.height, result.shiftX, result.shiftY);
                return result;
            } else {
                return;
            }
        },
		exchange: function() {

		},
        dnd: function(dropObj, options){
            if ((typeof dropObj) !== 'object') {
                return;
            }
            var settings = $.extend(true, {}, dndDefaults, options);
            $(document).on('dragenter', function(e){
                e.stopPropagation();
                e.preventDefault();
            })
            .on('dragover', function(e){
                e.stopPropagation();
                e.preventDefault();
            })
            .on('drop', function(e){
                e.stopPropagation();
                e.preventDefault();
            });
            $(this).on('dragenter', function(e){
                e.stopPropagation();
                e.preventDefault();
            })
            .on('dragover', function(e){
                e.stopPropagation();
                e.preventDefault();
            })
            .on('dragleave', function(e){
                e.stopPropagation();
                e.preventDefault();
            })
            .on('drop', function(e){
                e.preventDefault();
                dropObj.files = e.originalEvent.dataTransfer.files;
                if ( settings.handle === '' ) {
                    $(this).trigger(settings.customEvent);
                } else {
                    $(settings.handle).trigger(settings.customEvent);
                }
            });
        },
        editor: function(options){
            if ( !($(this).is('img')) ) {
                return;
            }
            var settings = $.extend(true, {}, previewDefaults, options);
            var target = $(this),
                editImg = $('<img>'), 
                submit = $('<span class="editor-submit">Crop</span>'),
                cancel = $('<span class="editor-cancel">Cancel</span>'),
                overlay = $('<div class="editor-overlay"></div>').append(submit).append(cancel).append(editImg);
            target.addClass('editing');
            $('body').prepend(overlay);
            setOverlay(overlay);
            editImg.on("load", function() {
                editImg.attr('init-size', target.attr('init-size') );
                editImg.attr('crop-data', target.attr('crop-data') );
                editImg.crop(settings);
            });
            editImg[0].src = target.attr('src');
            cancel.on('click', function(e){
                target.removeClass('editing');
                overlay.remove();
            });
            submit.on('click', function(e){
                target.removeClass('editing');
                var cropData = editImg.getCropResult(), 
                    editRatio = isNaN(parseFloat(settings.editRatio))? 1 : parseFloat(settings.editRatio);
                writeCropData(target, cropData.borderRatio, cropData.borderWidth, cropData.borderHeight, cropData.width, cropData.height, cropData.shiftX, cropData.shiftY);
                target.css({
                    'width': getPixel( parseFloat(cropData.width)/editRatio ),
                    'height': getPixel(parseFloat(cropData.height)/editRatio ),
                    'left': getPixel( parseFloat(cropData.shiftX)/editRatio),
                    'top': getPixel( parseFloat(cropData.shiftY)/editRatio)
                });
                overlay.remove();
            });
            function setOverlay(overlay){
                overlay.css({
                    'background-color': 'rgba(0, 0, 0, 0.8)',
                    'position': 'fixed',
                    'top': '0',
                    'right': '0',
                    'bottom': '0',
                    'left': '0',
                    'z-index': '12'
                });
                overlay.find('span').css({
                    'font-size': '20px',
                    'color': 'rgba(222,60,80,.9)',
                    'position': 'absolute',
                    'top': '30px',
                });
                overlay.find('span.editor-submit').css({
                    'left':'30px'
                });
                overlay.find('span.editor-cancel').css({
                    'left':'100px'
                });
            };
        },
		preview: function(options){
			var settings = $.extend(true, {}, previewDefaults, resizerDefaults, draggerDefaults, cropperDefaults, dndDefaults, options);
			var preview = $(this), uploader = $(settings.uploaderAttr), 
                dropObj = {};
            if (preview.length === 0) {
                return;
            }
			if ( uploader.length > 0 ) {
    			uploader.on('change', function(e){
                    var files = e.target.files;
    				handleImage(files);
    			});
            }
			preview.dnd(dropObj);
            preview.on(settings.customEvent, function(e){
                handleImage(dropObj.files);
            });
			function handleImage(files) {
				var uploadLength;
				if ( settings.maxPrevImgs === 'nolimit' ) {
                    uploadLength = files.length;
                } else {
                    if ( parseInt(settings.maxPrevImgs) <= 0 ) {
                        return;
                    } else {
                        var curImgLen = preview.find('img').length;
                        if ( (curImgLen + files.length) >  settings.maxPrevImgs ) { return; }
                        uploadLength = files.length;
                    }
                }
			    for ( var i=0 ; i < uploadLength; i++ ) {
			    	var f = files[i]
			    	if (!f.type.match('image.*')) {
                        continue;
                    }
			    	var reader = new FileReader();
				    reader.onload = ( function(theFile){
                        return function (e) {
                            var element = $('<div class="' + settings.prevWrapper + '"><img class="' + settings.prevImg + '"></div>'),
                                curImg = element.find('img');
                            preview.append(element);
                            curImg[0].file = theFile;
                            curImg.on('load', function(e){
                                var prevSize = getSize(curImg),
                                    editRatio = isNaN(parseFloat(settings.editRatio))? 1 : parseFloat(settings.editRatio),
                                    bothSize = processSize( settings.confineInWrap, settings.prevWrapRatio, settings.prevWrapWidth, settings.prevWrapHeight, settings.prevImgRatio, settings.prevImgWidth, settings.prevImgHeight, prevSize.width, prevSize.height );
                                writeInitSize(curImg, bothSize.iw*editRatio, bothSize.ih*editRatio);
                                writeCropData(curImg, settings.borderRatio, bothSize.ww*editRatio, bothSize.wh*editRatio, bothSize.iw*editRatio, bothSize.ih*editRatio, 0, 0);
                                setPreviewStyle(element, curImg, bothSize.ww, bothSize.wh, bothSize.iw, bothSize.ih);
                                if ( settings.edit ) {
                                    element.on(settings.triggerEdit,function(e){
                                        curImg.editor(settings);
                                    })
                                    .on(settings.removeEdit, function(e){
                                        $(this).remove();
                                    });
                                }
                            });
                            curImg.attr('src',e.target.result);
    					};
                    })(f);
                    reader.readAsDataURL(f);
				}
                function setPreviewStyle(wrapper, img, wrapWidth, wrapHeight, imgWidth, imgHeight){
                    wrapper.css({
                        'width': getPixel( wrapWidth ),
                        'height': getPixel( wrapHeight ),
                        'position':'relative',
                        'overflow':'hidden',
                        'display': 'inline-block',
                        'padding': '0'
                    });
                    img.css({
                        'width': getPixel( imgWidth ),
                        'height': getPixel( imgHeight ),
                        'position':'absolute',
                        'top': '0',
                        'left': '0'
                    });  
                };
			};
		},
        upload: function(path, objName){
            var preview = $(this), imgs = preview.find('img');
            if ( imgs.length === 0 ) {
                return;
            }
            for (var i = 0; i < imgs.length; i++) {
                new fileUpload(imgs[i].file, path, objName);
            }
            function fileUpload(file, path, objName) {
                var uri = path;
                var xhr = new XMLHttpRequest();
                var fd = new FormData();
            
                xhr.open('POST', uri, true);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        // Handle response.
                        //alert(xhr.responseText); // handle response.
                    }
                };
                fd.append(objName, file);
                // Initiate a multipart/form-data upload
                xhr.send(fd);
            };
        }
	});
})(jQuery);