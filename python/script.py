#Python 3
import argparse #docs https://docs.python.org/3/library/argparse.html
import PyPDF2 #docs https://pythonhosted.org/PyPDF2/
import sys
#import dateutil.parser #docs https://dateutil.readthedocs.io/ (doesnt seem like this lib will work out)

#allows arguments: python script.py file.pdf
parser = argparse.ArgumentParser()
parser.add_argument("pdf", help="pdf file location")
args = parser.parse_args()

pdfFileObj = open(args.pdf, 'rb')
pdfReader = PyPDF2.PdfFileReader(pdfFileObj)
print("encrypted: ",pdfReader.isEncrypted)

text = [] # each page's text is store in the text array
for pageNum in range(pdfReader.getNumPages()-1):
	pageObj= pdfReader.getPage(pageNum)
	text.append(pageObj.extractText().encode('utf-8').decode('ascii', 'ignore')) #encode utf-8 and decode to ascii (ignoring characters) to avoid errors
print(text)

temp = ''
for s in range(len(text[0])-4):
	if text[0][s].isdigit(): 
		temp += text[0][s]
		if text[0][s+1].isdigit(): 
			temp += text[0][s+1]
			if text[0][s+2] == ':': 
				temp += ':'
				if text[0][s+3].isdigit(): 
					temp += text[0][s+3]
					if text[0][s+4].isdigit():
						temp += text[0][s+4]
					print("Time", temp, "Found at index", s)
		elif text[0][s+1] == ':': 
			temp += ':'
			if text[0][s+2].isdigit(): 
				temp += text[0][s+2]
				if text[0][s+3].isdigit(): 
					temp += text[0][s+3]
				print("Time", temp, "Found at index", s)
	temp = ''