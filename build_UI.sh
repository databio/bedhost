# create React production build and copy over to bedhost/static/bedhost-ui
# note: assumes the bedhost-ui repository is cloned in ../bedhost-ui
# git clone git@github.com:databio/bedhost-ui.git
bedhost_dir=`pwd`
if [ ! -d "$bedhost_dir/../bedhost-ui" ]
then
    echo "Directory $bedhost_dir/../bedhost-ui does not exist!"
    exit 1
fi
cd $bedhost_dir/../bedhost-ui
echo ">>>>>> installing React dependancies"
npm install 
echo ">>>>>> building production package"
npm run build
rm -rf $bedhost_dir/bedhost/static/bedhost-ui
mkdir -p $bedhost_dir/bedhost/static/bedhost-ui
echo ">>>>>> copying package to $bedhost_dir/static/bedhost-ui"
cp -r ./build/* $bedhost_dir/bedhost/static/bedhost-ui
cd $bedhost_dir