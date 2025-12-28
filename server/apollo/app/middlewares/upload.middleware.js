const path = require('path');
module.exports={
    uploadProfileImage : async function(resolve, root, args, context, info){
        const fieldName = info['fieldName'];
        if(fieldName == 'getMyProfileDetails' || fieldName =='updateUser' || fieldName =='memberSearchByMobile'){
            args["Uploadimage"]="https://png.pngtree.com/png-clipart/20190924/original/pngtree-user-vector-avatar-png-image_4830521.jpg";
            //const imagePath = 'upload-profile-image/'+'user.jpg';
            //const dirname = path.join(__dirname,"../../");
            //const Uploadimage = path.join(dirname+imagePath);
            //console.log(Uploadimage);
            // const val= 'https://png.pngtree.com/png-clipart/20190924/original/pngtree-user-vector-avatar-png-image_4830521.jpg';
            //return Uploadimage;
        }
        if(fieldName == 'singleUpload'){
            console.log("fieldName--------",fieldName);
        }
        const result = resolve(root, args, context, info);
        return result;
    }
}