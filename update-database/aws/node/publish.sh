cd src 
zip -X -r ../function.zip *
cd .. 
aws lambda update-function-code --function-name adreyfus-testing-ReceiptFunction-CK9H0YLJHDI7 --zip-file fileb://function.zip

