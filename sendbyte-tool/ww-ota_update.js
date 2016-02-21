var stringifyBytes = function(buf,N) {
	var str = "[";
	for(var n=0;n<N;n++) {
		if(n>0)
			str+=',';
		str += '0x' + buf.readUInt8(n).toString(16);
	}
	str += ']';
	return str;
}
// debug log
var dlog = function(s) {   console.log(" FUNC >>> "+s); }
var errlog = function(s) { console.log("ERROR >>> "+s); }

var WWHW = require('./ww_hwdevice.js');

exports = module.exports = {

// ---------------------------------------------------------------------------------------------------

	// first two bytes of inbound data from Sensor Block states the Event Type
	// This map pairs the number to an event handler function
	EVENTHANDLERS : {
		'0x0001' : 'eventMode',
		'0x0002' : 'eventAdxl345',
		'0x0003' : 'eventLED'
	},
// ---------------------------------------------------------------------------------------------------
	/**
	An event handler. This handls inbound data.<br>
	<code>in_data</code> is an object of the format:<br>
<pre>
{
	buf : Buffer(N), // a Buffer object
	size : N,        // the size of the data in bytes
	rinfo :          // A Node.js rinfo object -  {"address":"aaaa::205:c2a:8c35:8a06","family":"IPv6","port":3001,"size":8} 
	                 // see here or more: http://nodejs.org/docs/latest/api/all.html#all_event_message
}
</pre>
	*/
	eventMotion : function(in_data) {
	    //VERIFIED
	    var ret = {};
	    ret.sens = in_data.buf.readUInt8(WWHW.SB.MOTION.RPOS.SENS);
	    return ret; // returns true if valid data, or false if the data made no sense.
	},
	eventAdxl345 : function(in_data) {
		// TODO - process in_data

		// TODO - put outpput to console 

		dlog('eventAdxl345 func.');
		dlog('data is = ' + stringifyBytes(in_data.buf, in_data.size));
		dlog('Adxl345 = 0x' + in_data.buf.readUInt8(4).toString(16));
		//var num = in_data.buf.readUInt16LE(5);
		//dlog('16 bit number after = 0x' + num.toString(16));

		var ret = {};
		ret.act = in_data.buf.readUInt8(4).toString(16);
		ret.xaxis = in_data.buf.readUInt8(5);
		ret.yaxis = in_data.buf.readUInt8(6);
		ret.zaxis = in_data.buf.readUInt8(7);
                ret.interrupt = in_data.buf.readUInt8(8).toString(16);

		return ret; // returns true if valid data, or false if the data made no sense.
	},

    //SAMPLE 
    testFuncOne : function(start,two) {
	// NOTE: all function must return an object in this format:
	var ret = {
	    totalbytes: 0, // the amount of bytes to send
	    buffer: null  // A Buffer object
	}
	if(start == undefined)
	    return null;
	
		// this test harness requires strings as parameter, so do some conversion
		var s= parseInt(start);
		if(two)
			var s2 = parseInt(two);
		else
			s2 = 0;

		// allocate a Buffer for storing bytes:
		ret.buffer = new Buffer(60);

		// debuggin output is cool:
		console.log("Start = " + start);

		// fill up the buffer with what you need
		ret.buffer.writeUInt8(s + 0x01 + s2,0);
		ret.buffer.writeUInt8(s + 0x02 + s2,1);
		ret.buffer.writeUInt8(s + 0x03 + s2,2);
		ret.buffer.writeUInt8(s + 0x04 + s2,3);

		// make sure to say how many bytes you are sending, here 4:
		ret.totalbytes = 4;

		// return the object - if the function fails return null
		return ret;
	},
	enableOTA : function(Mode) {
		// NOTE: all function must return an object in this format:
		var ret = {
			totalbytes: 0, // the amount of bytes to send
			buffer: null  // A Buffer object
		}
		

		// allocate a Buffer for storing bytes:
		//ret.buffer = new Buffer(60); //original buffer size

		ret.buffer = new Buffer(120); //should cause to send two packets

		// fill up the buffer with what you need
		ret.buffer.writeUInt8(parseInt(Mode),0); // put 0x0A in position 0
		//ret.buffer.writeUInt8(parseInt(ONOFF),1); // put 0x0A in position 0
		//ret.buffer.writeUInt8(parseInt(DLY),2);
		//ret.buffer.writeUInt8(parseInt(R),3);
		//ret.buffer.writeUInt8(parseInt(G),4);
		//ret.buffer.writeUInt8(parseInt(B),5);
		//ret.buffer.writeUInt8(parseInt(FLASH),6);
		//ret.buffer.writeUInt8(parseInt(R2),7);
		//ret.buffer.writeUInt8(parseInt(G2),8);
		//ret.buffer.writeUInt8(parseInt(B2),9);

		// make sure to say how many bytes you are sending, here 4:
		ret.totalbytes = 120;
	    
	   	return ret;
	}
	
};
