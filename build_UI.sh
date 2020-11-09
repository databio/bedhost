echo '>>>>>> installing React dependancies'
npm install 
echo '>>>>>> building production package'
npm run build
rm -rf ../bedhost/static/*
mkdir -p ../bedhost/static/bedhost-ui
echo '>>>>>> copying package to bedhost/static/bedhost-ui'
cp -r ./build/* ../bedhost/static/bedhost-ui
