import * as THREE from '../../libs/three/three.module.js';
import { GLTFLoader } from '../../libs/three/jsm/GLTFLoader.js';
import { FBXLoader } from '../../libs/three/jsm/FBXLoader.js';
import { RGBELoader } from '../../libs/three/jsm/RGBELoader.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { vector3ToString } from '../../libs/DebugUtils.js';
import { Stats } from '../../libs/stats.module.js';
import { ARButton } from '../../libs/ARButton.js';

let modelViewerObj;

class App{
	constructor(){
		const container = document.createElement( 'div' );
        document.body.appendChild( container );
        
        this.chairBool = false;
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 4, 14 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xaaaaaa );

		const ambient = new THREE.HemisphereLight(0xffffff, 0x666666, 0.3);
        this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight();
        light.position.set( 0.2, 1, 1.5);
        this.scene.add(light);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        this.setEnvironment();
		container.appendChild( this.renderer.domElement );
        
        //Add code here
        this.loadingBar = new LoadingBar();
        this.loadGLTF(); //or this.loadFBX();

        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();

        this.initScene();
        this.setupAR();
        
        window.addEventListener('resize', this.resize.bind(this) );
    }

    loadGLTF(){
        const self = this;
        const loader = new GLTFLoader().setPath('../../assets/');
        loader.load(
            'office-chair.glb',
            function(gltf){
                self.chair = gltf.scene;
                const bbox = new THREE.Box3().setFromObject( gltf.scene );
                console.log(`min:${vector3ToString(bbox.min, 2)} - 
                max:${vector3ToString(bbox.max, 2)}`);
                self.scene.add( gltf.scene );
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop( self.render.bind(self) ); 
            },
            function(xhr){
                self.loadingBar.progress = xhr.loaded/xhr.total;
            },
            function(err){
                console.log( 'An error happened' );
            }        
        )
    }
    
    loadFBX(){
        const self = this;
        const loader = new FBXLoader().setPath('../../assets/');

        loader.load(
            'office-chair.fbx',
            function(object){
                self.chair = object;
                const bbox = new THREE.Box3().setFromObject( object );
                console.log(`min:${vector3ToString(bbox.max, 2)}`);
                self.scene.add( object );
                self.loadingBar.visible = false;
                self.renderer.setAnimationLoop( self.render.bind(self) ); 
            },
            function(xhr){
                self.loadingBar.progress = self.xhr.loaded/self.xhr.total;
            },
            function(err){
                console.log( 'An error happened' );
            }        
        )
    }
    
    initScene(){
         this.geometry = new THREE.BoxBufferGeometry( 0.06, 0.06, 0.06 ); 
         this.meshes = [];      
    }
    
    setupAR(){
         this.renderer.xr.enabled = true; 

         const self = this;
         let controller;
        
        function onSelect() {
            const material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
            const mesh = new THREE.Mesh( self.geometry, material );
            mesh.position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
            mesh.quaternion.setFromRotationMatrix( controller.matrixWorld );
            self.scene.add( mesh );
            self.meshes.push( mesh );
        }

        const btn = new ARButton( this.renderer );

         controller = this.renderer.xr.getController( 0 );
         controller.addEventListener( 'select', onSelect );
         this.scene.add( controller );
        
        // this.renderer.setAnimationLoop( this.render.bind(this) );
    }
    
    setEnvironment(){
        const loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const self = this;
        
        loader.load( '../../assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          self.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment');
        } );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.chair.rotateY( 0.01 );

        if(this.meshes.length > 0)
        {
          //Buscar alternativa
          this.chair.visible = false;
          this.scene.background.enabled = false;
        }

        //this.stats.update();
        this.meshes.forEach( (mesh) => { mesh.rotateY( 0.01 ); });
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };