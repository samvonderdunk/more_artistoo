let CPM = require("../../build/artistoo-cjs.js")


/* */

"use strict"


/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let config = {

	// Grid settings
	ndim : 2,
	field_size : [200,200],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [false,false],				// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 4,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
			
		LAMBDA_VRANGE_MIN : [0,1],			// MIN/MAX volume for the hard volume constraint
		LAMBDA_VRANGE_MAX : [0,2]
	},
	
	// Simulation setup and configuration
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [4000],						// Number of cells to seed for all
											// non-background cellkinds.
		// Runtime etc
		BURNIN : 0,
		RUNTIME : 10000,
		
		// Visualization
		CANVASCOLOR : "000000",
		CRYSTALCOLOR : "FFFFFF",
		FREECOLOR : "3782fa",
		zoom : 2,							// zoom in on canvas with this factor.
		LOGSTATS : { browser: true, node: true }


	}
}
/*	---------------------------------- */
let sim, meter, Fixed, Free, FreeGM, FreeCanvas, FixedCanvas, t=0
let conf 


function initialize(){

	// The CPM with the diffusing particles (using hard volume range constraint)
	Free = new CPM.CPM( config.field_size, config.conf )
	let hardvolconstraint = new CPM.HardVolumeRangeConstraint( config.conf )
	Free.add( hardvolconstraint )
	FreeGM = new CPM.GridManipulator( Free )
	
	
	// The CA with the aggregate
	Fixed = new CPM.CA( config.field_size, {
		"UPDATE_RULE": 	function(p,N){
			
			if( this.pixt(p) == 0 ){
				let hasNeighbor = false
				for( let pn of N ){
					if( this.pixt(pn) == 1 ){
						hasNeighbor = true
						break
					}
				}
			
				if( Free.cellKind( Free.pixt(p) ) == 1 && hasNeighbor ){
				
					// remove this particle from the 'free' CPM:
					const cid = Free.pixt(p)
					FreeGM.killCell( cid )
					
					// and add it to the 'fixed' CA:
					return 1
				}
				
				return 0
			}
			return 1
			
			
		}
	})
	
	FreeCanvas = new CPM.Canvas( Free, {zoom:config.simsettings.zoom} )
	initializeGrids()
	conf = { runtime : config.simsettings.RUNTIME }
	run()
}


function initializeGrids(){
	for( let i = 0; i < config.simsettings.NRCELLS[0]; i++ ){
		FreeGM.seedCell( 1 )
	}
	Fixed.setpix( [100,100], 1 )
}

function draw(){
		FreeCanvas.clear( config.simsettings.CANVASCOLOR )
		
		// Draw the crystal from the FixedCanvas on the FreeCanvas
		FreeCanvas.col( config.simsettings.CRYSTALCOLOR )
		FreeCanvas.getImageData()
		for( let x of Fixed.pixels() ){
			if( x[1] === 1 ){
				FreeCanvas.pxfi( x[0] )
			}
		}
		FreeCanvas.putImageData()
		
		
		FreeCanvas.drawCells( 1, config.simsettings.FREECOLOR )
		//FixedCanvas.drawCellsOfId( 1, "FFFFFF" )
}

function logStats(){
	const freeCells = Object.keys( Free.getStat( CPM.PixelsByCell ) ).length
	const fixedCells = Fixed.getStat( CPM.PixelsByCell )[1].length
	console.log( Free.time + "\t" + freeCells + "\t" + fixedCells + "\t" + ( freeCells + fixedCells ) )
}

function step(){

	/*if( t > 2 && t < 10 ){
		for( let i = 0; i < 1000; i++ ){
			draw()
		}
	}*/
	for( let i = 0; i < 1; i++ ){
		Fixed.timeStep()
		Free.timeStep()
		t++
	}
	draw()
	logStats()
}

// all steps
function run(){
	 while( t < conf.runtime){
			step()
	 }
}
initialize()
