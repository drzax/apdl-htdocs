var svgIconConfig = {
	hamburgerCross : {
		url : 'themes/default/images/hamburger.svg', 
		animation : [
			{ 
				el : 'path:nth-child(1)', 
				animProperties : { 
					from : { val : '{"path" : "m 5.0916789,20.818994 53.8166421,0"}' }, 
					to : { val : '{"path" : "M 12.972944,50.936147 51.027056,12.882035"}' }
				} 
			},
			{ 
				el : 'path:nth-child(2)', 
				animProperties : { 
					from : { val : '{"transform" : "s1 1", "opacity" : 1}', before : '{"transform" : "s0 0"}' }, 
					to : { val : '{"opacity" : 0}' }
				} 
			},
			{ 
				el : 'path:nth-child(3)', 
				animProperties : { 
					from : { val : '{"path" : "m 5.0916788,42.95698 53.8166422,0"}' }, 
					to : { val : '{"path" : "M 12.972944,12.882035 51.027056,50.936147"}' }
				} 
			}
		]
	},
	flag : {
		url : 'themes/default/images/flag.svg',
		animation : [
			{ 
				el : 'path', 
				animProperties : { 
					from : { val : '{"path" : "m 11.75,11.75 c 0,0 10.229631,3.237883 20.25,0 10.020369,-3.2378833 20.25,0 20.25,0 l 0,27 c 0,0 -6.573223,-3.833185 -16.007359,0 -9.434136,3.833185 -24.492641,0 -24.492641,0 z"}' }, 
					to : { val : '{"path" : "m 11.75,11.75 c 0,0 8.373476,-4.8054563 17.686738,0 9.313262,4.805456 22.813262,0 22.813262,0 l 0,27 c 0,0 -11.699747,4.363515 -22.724874,0 C 18.5,34.386485 11.75,38.75 11.75,38.75 z"}' }
				} 
			}
		]
	},
	maximizeRotate : { 
		url : 'themes/default/images/maximize.svg',
		animation : [
			{ 
				el : 'path:nth-child(1)', 
				animProperties : { 
					from : { val : '{"transform" : "r0 16 16 t0 0"}' }, 
					to : { val : '{"transform" : "r180 16 16 t-5 -5"}' }
				} 
			},
			{ 
					el : 'path:nth-child(2)', 
				animProperties : { 
					from : { val : '{"transform" : "r0 48 16 t0 0"}' }, 
					to : { val : '{"transform" : "r-180 48 16 t5 -5"}' }
				} 
			},
			{ 
				el : 'path:nth-child(3)', 
				animProperties : { 
					from : { val : '{"transform" : "r0 16 48 t0 0"}' }, 
					to : { val : '{"transform" : "r-180 16 48 t-5 5"}' }
				} 
			},
			{ 
				el : 'path:nth-child(4)', 
				animProperties : { 
					from : { val : '{"transform" : "r0 48 48 t0 0"}' }, 
					to : { val : '{"transform" : "r180 48 48 t5 5"}' }
				} 
			}
		]
	}
};