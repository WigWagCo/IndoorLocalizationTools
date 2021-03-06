// send-bytes.js
var dgram = require('dgram');
var optparse = require('optparse');


var D_PORT = 33333;
var D_ADDR = 'aaaa::0205:0c2a:8c35:8a06';
var S_PORT = 1111;
var S_ADDR = undefined;


var FRZ_PROTO = require('./frz-proto.js');


// debug log
var dlog = function(s) {   console.log("  DEB >>> "+s); }

var errlog = function(s) { console.log("ERROR >>> "+s); }

//var message = new Buffer('My KungFu is Good!');
var client = dgram.createSocket('udp6');


var switches = [
	[ '-h', '--help', 'Help info'],
	[ '-s', '--sourceaddr [addr]', 'Source address'],
	[ '-d', '--destaddr [addr]', 'Destination address'],
	[ '-sp', '--sourceport [port]', 'Source port'],
	[ '-dp', '--destport [port]', 'Destination port'],
	[ '-exec', '--execute [funcname]', 'Execute a function for data' ],
	['-r', '--reset', 'Send reset flag.'],
	['-l', '--listen', 'Listen only.'],
	['-c', '--code [file]', 'Code library to use.']
]

var exec_func = null;
var exec_func_name = null;
var parser = new optparse.OptionParser(switches);
var needs_reset = false;
var listen_only = false;

CODELIB = 'sensor-block-proto.js';

// ------------ options -----------------
parser.on('help',function() {
	console.log("Help...");
});

parser.on('sourceaddr',function(name,value){
	S_ADDR = value;
});
parser.on('destaddr',function(name,value){
	D_ADDR = value;
});
parser.on('sourceport',function(name,value){
	S_PORT = parseInt(value);
});
parser.on('destport',function(name,value){
	D_PORT = parseInt(value);
	console.log("D_PORT = " + D_PORT);
});
parser.on('reset',function(name,value){
	needs_reset = true;
});
parser.on('listen',function(name,value){
	listen_only = true;
});
parser.on('code',function(name,value){
	CODELIB = value;
	console.log("Using library: " + CODELIB);
});




parser.on('execute', function(name,value) {
	var FUNCS = require('./' + CODELIB);
	if(!FUNCS[value]) {
		console.log("Unknown function!");
		process.exit(1);
	} else {
		exec_func_name = value;
		exec_func = FUNCS[exec_func_name];
	}
});



//var outBytesStr = [];
var outBuffer = new Buffer(310);
//console.log(outBuffer.length);
var sendBytes = 0;

var commaString = undefined;
var reset_flag = false;

parser.on(2, function(value) {

		console.log('nums: ' + value);
		commaString = value.split(',');

});


// // Parse command line arguments
parser.parse(process.argv);

if(exec_func) {
	console.log("Using function " + exec_func_name + " for data gen.");

	var output = null;	
	console.log("  EXEC: " + exec_func_name + "("+commaString+") ...");
	output = exec_func.apply(undefined,commaString);
	if(!output) {
		console.log(" function failed. Returned null. Check your parameters");
		process.exit(1);
	}

	sendBytes = output.totalbytes;
	outBuffer = output.buffer;
		// data
} else {
	if(commaString) {
		for(var n=0;n<commaString.length;n++) {
			console.log(commaString[n]);
			if(commaString[n] > 255) {
				console.log("ERROR: a number was larger than a byte!");
				return;
			} else {
				outBuffer.writeUInt8(parseInt(commaString[n]),n);
			}
		}
	sendBytes = commaString.length;
	} else
	sendBytes = 0;
}

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

var str = stringifyBytes(outBuffer,sendBytes);

if(sendBytes > 0)
	console.log("Will send " + sendBytes + " bytes. " + str);

// ---------------------------------------
var resend = 0;
var blastnum = 0;

if(1) {
	console.log( "  SRC->DEST = " + S_ADDR + ":" + S_PORT + " --> " + D_ADDR + ":" + D_PORT);

	// finalSendBytes = sendBytes + FRZ_PROTO.FRZ_HEADER_SIZE;
	// if(finalSendBytes > FRZ_PROTO.MAX_PACK_SIZE)
	// 	console.log("WARNING: will be multiple packets. " + (finalSendBytes/FRZ_PROTO.MAX_PACK_SIZE)+1 + " packets needed."); 


	var totalsent = 0;
	var totalpacks = 0;
	var packnumber = 0;


        /////*********check packet sizes
	totalpacks = Math.floor(sendBytes / FRZ_PROTO.MAX_FRZ_PAYLOAD);
	if((sendBytes % FRZ_PROTO.MAX_FRZ_PAYLOAD) > 0)
		totalpacks++; 

	if(totalpacks>1)
		console.log("WARNING: will be multiple packets. " + totalpacks + " packets needed."); 

	var flags = 0;
	// setup header
	// if reset only op:
	if(reset_flag && (!sendBytes)) {
		flags |= FRZ_PROTO.FRZ_FLAG_RESET;
	}

	function dec2hex(i) {
   		return (i+0x10000).toString(16).substr(-4).toUpperCase();
	}

	var tempsend = 0;
	var ackcheck = 0;

	var processInbound = function(buf, rinfo) {
		//if(rinfo.size < FRZ_PROTO.FRZ_HEADER_SIZE) {
			//errlog("Tiny packet. ?? " + rinfo.size);
			//return;
		//}
		if(rinfo.size == FRZ_PROTO.FRZ_HEADER_SIZE) {
			//dlog("Recv header only.");
		}
		//if(FRZ_PROTO.GET_FRZ_FLAGS(buf) & FRZ_PROTO.FRZ_FLAG_ACK){
			//dlog("Recv ACK. Ok.");

			if(tempsend == (packnumber-1)){

				blastnum++;
				//console.log(" " );
				//console.log("blast number" + blastnum);
				//console.log(" " );
				tempsend = 0;
				ackcheck = 1;
 					sendPack(outBuffer,sendBytes,FRZ_PROTO.MAX_PACK_SIZE,D_ADDR,D_PORT,S_ADDR,S_PORT,flags);
			}else
				tempsend++;

			
				

			
		//}
		/*if(rinfo.size > FRZ_PROTO.FRZ_HEADER_SIZE) { 
			dlog( "Buffer was: " + stringifyBytes(buf,rinfo.size));
			var offset = FRZ_PROTO.FRZ_HEADER_SIZE;
			var category = buf.readUInt16LE( offset );
			switch(category) {
				case FRZ_PROTO.CATEGORY.ASYNC_PUSH: 
					dlog("Have an ASYNC_PUSH.");
					offset += 2;
					var eventcode = buf.readUInt16LE( offset );
					var str_code = '0x' + dec2hex(eventcode);
					dlog("Event code: " + str_code);
					var func_name = FUNCS.EVENTHANDLERS[str_code];
					if(func_name) {
						dlog("Found handler: " + func_name);
						var func = FUNCS[func_name];
						if(!func) {
							errlog("No function named: " + func_name + " in test function file.");
						} else {
							var payloadonly = buf.slice(FRZ_PROTO.FRZ_HEADER_SIZE);
							var results = func.call(undefined,{ buf: payloadonly, size: rinfo.size - FRZ_PROTO.FRZ_HEADER_SIZE, rinfo: rinfo });
							if(results !== undefined) {
								dlog("  Results of func: " + JSON.stringify(results));
							} else 
								dlog("  No results.");
						}
					} else {
						errlog("Can't find a corresponding function name for this eventcode.");
					}
					break;
				default:
					dlog("Protocol category - Unimplemented: " + category + " " + dec2hex(category));
			}
			console.log(" ---------------------------- ");
		}*/

	}



	client.bind(S_PORT,S_ADDR);

	client.on('listening', function() {
		//dlog(" ---- ready for response");
	});

	client.on('message', function(msg, rinfo) { // msg is a Buffer
		//dlog("   >> data from " + rinfo.address + ":" + rinfo.port);
		//dlog("   >> rinfo = " + JSON.stringify(rinfo));
		processInbound(msg,rinfo);
		
	});

	client.on('error', function(err) {
		console.log(" Socket error -> OOPS: " + e.message + " --> " + e.stack);
	});


	function splitBuffer(tbuf,packet) {
  		 p = 0;
		var buf2 = new Buffer(72);
  	//for (var i = (packet*64); i < (64*(packet+1)); i++) {
    		var i = (packet*64)
 		
		console.log()
			
		//console.log(tbuf[i]);
		//for(var i = 0; i<8;i++){
			//buf2[i] = 0;
		//}

		 buf2.copy(tbuf.slice(0, 64),8);
			
		for(var j = 0; j<64;j++)
			console.log( buf2[j])
  	//}

  	return buf2;
	}



	var tempBuffer = new Buffer(1000000);


	var looping = false;
	var fs = require("fs");
	//var r = new FileReader();

	var filename = "./flasher";
	var tempBuffer666 = fs.readFileSync(filename);
	totalpacks = 874;// (tempBuffer666.length + (64/2)) / 64;
	var ttemp = tempBuffer666.length % 64;
	var LPdiv = 64 / ttemp;
	//totalpacks = 1;
	var done = 0;
	packssent = 0;

	var out = 0;
		//resend = 0;
	///*********where packet is sent...need a loop in here that will spilt up a fill into packets
	var sendPack = function(buffer,totalsize,maxsendsize, d_addr, d_port, s_addr, s_port, flags) {
		//var sendsize = 0;

	//var file = "WW-sensor-board_ww-sensor-block.bin"
	totalsize = 12000;
	maxsendsize = 94;//need to have a set max send size
	sendsize = 64;
	sentsize = 0;
	burstsize = 1;
	packnumber = 0;
	var outBuffer = new Buffer(310);
	

		//console.log("file" + file);
	
	if(packssent < totalpacks){
	while(packnumber<burstsize && packssent != totalpacks){//while loop based on total packets      totalsent < totalsize


/*if(totalsent < totalsize) {
			sendsize = totalsize - totalsent;
			if(sendsize > maxsendsize){
				sendsize = maxsendsize;
			}
		} else {
			// send a header only?
			sendsize = 0;
			if(!flags) {
				console.log("sendPack: send what???");
				return;
			}
		}*/		

		//packet size and number of packets that will be needed
		//console.log("maxsendsize " + maxsendsize);
		//console.log("FRZ_PROTO.MAX_FRZ_PAYLOAD " + FRZ_PROTO.MAX_FRZ_PAYLOAD);
		//console.log("totalsize " + totalsize);
		//console.log("sendsize " + sendsize);
		//console.log("sentsize " + sentsize);
		//console.log(" ");
		//console.log("packs: " + (packssent+1) + "/" + totalpacks)
		


		//console.log(tempBuffer666.length/64);
		//console.log(LPdiv);

		//console.log("blast number" + blastnum);

		///need to figure out how to break up buffer into sections///////////////////////////////////////////
		//break up buffer into maxsendsize
		//var sendBuffer = new Buffer(sendsize + FRZ_PROTO.FRZ_HEADER_SIZE);
			
		//sendBuffer.fill(packssent+1); // zero it out

		var splitdata = new Buffer(72);
		var tsplitdata = new Buffer(sendsize);
		//splitdata = splitBuffer(tempBuffer,packssent);

		//for(var j = 0; j<64;j++)
			//console.log( tempBuffer666[j])

		//splitdata.copy(tempBuffer666.slice(0, 64),8);


		if(packssent == 0){
		   tsplitdata = tempBuffer666.slice((0), (60))
			tsplitdata.copy(splitdata,8);
		}else if(packssent+1 != totalpacks){	   
		   	tsplitdata = tempBuffer666.slice((60+((packssent-1)*64)), ((60+((packssent-1)*64))+(64)))
			tsplitdata.copy(splitdata,8);
		}else{
			splitdata.fill(0xff);
			tsplitdata = tempBuffer666.slice((60+((packssent-1)*64)), ((60+((packssent-1)*64))+((64/LPdiv)+4)))
			tsplitdata.copy(splitdata,8);	
		}
		
		//for(var ttt = 0; ttt<20000000;ttt++){
		//}
		
			
		//for(var j = 0; j<72;j++)
		
		

		//console.log( splitdata.length)
		
		
		//console.log("sendbuffer " + splitdata.length);

		//console.log(splitdata);
		
		//if(sendsize)
			//outBuffer.copy(sendBuffer,FRZ_PROTO.FRZ_HEADER_SIZE,0,sendsize);
		


		//if(out == 0 && resend == 0){
		//if(resend == 0){

	

			//outBuffer.copy(splitdata,0,8,72); // copy the byte buffer into our final send buffer, leave room for header

			//console.log(splitdata)
			
			//outBuffer.copy(sendBuffer,FRZ_PROTO.FRZ_HEADER_SIZE,64,sendsize+64); // copy the byte buffer into our final send buffer, leave room for header


			
			//outBuffer.copy(sendBuffer,FRZ_PROTO.FRZ_HEADER_SIZE,128,sendsize+128); // copy the byte buffer into our final send buffer, leave room for header
			//out = 1;
		//}

		sentsize += sendsize;
		
		//console.log("packerss: " + ((packssent+1)<<8) )
		
		FRZ_PROTO.SET_FRZ_FLAGS(splitdata,flags); // set any passed in flags
		if(packssent == 0 ) { // the first packet gets the total number of packets
			FRZ_PROTO.SET_FRZ_OPTIONAL(splitdata, ((((totalpacks)<<8) & 0x0ff00) + ((totalpacks)>>8))); // set any passed in flags//
			//FRZ_PROTO.SET_FRZ_OPTIONAL(splitdata, 0x3 << 8);
			FRZ_PROTO.SET_FRZ_FLAGS(splitdata, FRZ_PROTO.GET_FRZ_FLAGS(splitdata) | FRZ_PROTO.FRZ_FLAG_FIRST);
			
			//packssent = 0x665;
			//console.log("packerss: " +  ((((packssent+1)<<8) & 0x0ff00) + ((packssent+1)>>8)) )//(((packssent+1)<<8) & 0x0ff00) +

			FRZ_PROTO.SET_FRZ_MSG_ID(splitdata, ((((packssent+1)<<8) & 0x0ff00) + ((packssent+1)>>8)) );
			if(needs_reset)
				FRZ_PROTO.SET_FRZ_FLAGS(splitdata,FRZ_PROTO.GET_FRZ_FLAGS(splitdata) | FRZ_PROTO.FRZ_FLAG_RESET); // set any passed in flags
		}else{

			FRZ_PROTO.SET_FRZ_MSG_ID(splitdata, ((((packssent+1)<<8) & 0x0ff00) + ((packssent+1)>>8)));
			//FRZ_PROTO.SET_FRZ_MSG_ID(splitdata, (((packssent+1)) >> 8) );
			//FRZ_PROTO.SET_FRZ_OPTIONAL(sendBuffer, packssent); // set any passed in flags
			//FRZ_PROTO.SET_FRZ_OPTIONAL(splitdata, totalpacks);
			FRZ_PROTO.SET_FRZ_OPTIONAL(splitdata,((((totalpacks)<<8) & 0x0ff00) + ((totalpacks)>>8))); // set any passed in flags//
			//FRZ_PROTO.SET_FRZ_OPTIONAL(splitdata, 0x3 << 8); // set any passed in flags//
			if((packnumber+1) == totalpacks) {
				FRZ_PROTO.SET_FRZ_FLAGS(splitdata,FRZ_PROTO.GET_FRZ_FLAGS(splitdata) | FRZ_PROTO.FRZ_FLAG_LAST);	
			}
		}
		

		FRZ_PROTO.SET_FRZ_SEQ_ID(splitdata,packnumber);

		if(resend == 0){
			console.log( splitdata)
		}



		//console.log("attempting send pack "+packnumber+"... (" + sendsize + " data bytes, "+(sendsize + FRZ_PROTO.FRZ_HEADER_SIZE)+" total bytes)");

//		setTimeout(function () {
		//console.log( splitdata);
		if(done == 0){
		client.send(splitdata, 0, sendsize + FRZ_PROTO.FRZ_HEADER_SIZE, d_port, d_addr,function(err, bytes) {
    			//console.log('INSIDE');
			if (err){ 
				//console.log(" OOPS: " + err.message + " --> " + err.stack);
			}
			else {
	    			//console.log('UDP message sent to ' + d_addr +':'+ d_port + " ... " + bytes + " bytes sent."); 
	    		// why is 'bytes' always undefined???!!
    		//	totalsent += bytes;
			
				//packnumber++;
				totalsent += sendsize; // bytes is not returning  so we do this HACK HACK HACK
				
				if(totalsent < sendsize) {
					if(totalsent == 0) {
						if(looping == true)
							//process.exit(1);			
						looping = true;
					}
					//setImmediate(sendPack, buffer,totalsize,maxsendsize, d_addr, d_port, s_addr, s_port, flags);
				}
			}
		
			//client.close();
			//jj = 0;
			//while(jj<100000000){jj++;}
		
			});
			}
//		}, 25*(packnumber));
		
			packnumber++;
			packssent++;
		}// while loop end**************************
			
		setTimeout(function () {
    			// and call `resolve` on the deferred object, once you're done
			if(ackcheck == 0){
				resend = 1;
				tempsend = 0;
				packssent--;
				//packssent--;
				//packssent--;
 				sendPack(outBuffer,sendBytes,FRZ_PROTO.MAX_PACK_SIZE,D_ADDR,D_PORT,S_ADDR,S_PORT,flags);
			}
			if(done == 0){
				resend = 0;
				ackcheck = 0;
			}

		}, 20000);



		}else{
			//console.log("DONE");
			ackcheck = 1;
			done = 1;
		}


		}


	


	if(!listen_only){	
		sendPack(outBuffer,sendBytes,FRZ_PROTO.MAX_PACK_SIZE,D_ADDR,D_PORT,S_ADDR,S_PORT,flags);
		//setTimeout(sendPack(outBuffer,sendBytes,FRZ_PROTO.MAX_PACK_SIZE,D_ADDR,D_PORT,S_ADDR,S_PORT,flags),5000);
		//setTimeout(sendPack(outBuffer,sendBytes,FRZ_PROTO.MAX_PACK_SIZE,D_ADDR,D_PORT,S_ADDR,S_PORT,flags),10000);		
}
	else 
		console.log("Listen only. Waiting...");
}

	// try {
	// 	sendNWait(finalSendBuffer,finalSendBytes,FRZ_PROTO.MAX_PACK_SIZE,D_ADDR,D_PORT,S_ADDR,S_PORT);
	// } catch (e) {

	// 	console.log(" OOPS: " + e.message + " --> " + e.stack);
	// }


