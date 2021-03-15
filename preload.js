window.require = (req) => {
    if(req == "electron"){
        return {
            ...require(req),
            remote:{
                app:{
                    getMainWindow:()=>{
                        return {
                            focus: ()=>{
                                window.utools.showMainWindow();
                            }
                        }
                    }
                }
            }
        }
    }
    return require(req)
}
window.BufferProxy = Buffer
window.runtime = () => process;
