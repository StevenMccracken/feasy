//
//  FeasyApi.swift
//  Feasy
//
//  Created by Steven McCracken on 9/15/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import Foundation

class FeasyApi {
    
    static let apiUrl = "http://localhost:8080" //"https://api.feasy-app.com"
    
    static func post(path: String, parameters: [String: Any], completion: @escaping (HTTPURLResponse, [String: Any]) -> Void) {
        let postRequest: URLRequest = self.createPostRequest(path: path, requestParameters: parameters)
        self.sendRequest(request: postRequest) { response, json in
            completion(response, json)
        }
    }
    
    static func get(path: String, completion: @escaping (HTTPURLResponse, [String: Any]) -> Void) {
        let getRequest: URLRequest = self.createRequest(path: path)
        self.sendRequest(request: getRequest) { response, json in
            completion(response, json)
        }
    }
    
    static func put(path: String, parameters: [String: Any], completion: @escaping (HTTPURLResponse, [String: Any]) -> Void) {
        let putRequest: URLRequest = self.createPutRequest(path: path, requestParameters: parameters)
        self.sendRequest(request: putRequest) { response, json in
            completion(response, json)
        }
    }
    
    static func delete(path: String, parameters: [String: Any], completion: @escaping (HTTPURLResponse, [String: Any]) -> Void) {
        let deleteRequest: URLRequest = self.createDeleteRequest(path: path, requestParameters: parameters)
        self.sendRequest(request: deleteRequest) { response, json in
            completion(response, json)
        }
    }
    
    static func createPostRequest(path: String, requestParameters: [String: Any]) -> URLRequest {
        var postRequest: URLRequest = self.createRequest(path: path)
        postRequest.httpMethod = "POST"
        
        let parameterString: String = self.urlEncodedString(fromParams: requestParameters)
        postRequest.httpBody = parameterString.data(using: .utf8)
        
        return postRequest
    }
    
    static func createGetRequest(path: String) -> URLRequest {
        var getRequest: URLRequest = self.createRequest(path: path)
        getRequest.httpMethod = "GET"
        
        return getRequest
    }
    
    static func createPutRequest(path: String, requestParameters: [String: Any]) -> URLRequest {
        var postRequest: URLRequest = self.createRequest(path: path)
        postRequest.httpMethod = "PUT"
        
        let parameterString: String = self.urlEncodedString(fromParams: requestParameters)
        postRequest.httpBody = parameterString.data(using: .utf8)
        
        return postRequest
    }
    
    static func createDeleteRequest(path: String, requestParameters: [String: Any]) -> URLRequest {
        var postRequest: URLRequest = self.createRequest(path: path)
        postRequest.httpMethod = "DELETE"
        
        let parameterString: String = self.urlEncodedString(fromParams: requestParameters)
        postRequest.httpBody = parameterString.data(using: .utf8)
        
        return postRequest
    }
    
    private static func createRequest(path: String) -> URLRequest {
        // Create the URL request with the given path
        let urlString: String = "\(apiUrl)\(path)"
        let url: URL = URL(string: urlString)!
        var request: URLRequest = URLRequest(url: url)
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        
        // Add the token to the request
        if let token = LoginManager.getToken() {
            request.addValue(token, forHTTPHeaderField: "Authorization")
        }
        
        return request
    }
    
    static func sendRequest(request: URLRequest, completion: @escaping (HTTPURLResponse, [String: Any]) -> Void) {
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            var httpResponse = HTTPURLResponse()
            var responseJson = [String: Any]()
            
            // Catch any error while trying to send the request
            if error != nil {
                print(error!.localizedDescription)
                completion(httpResponse, responseJson)
            } else {
                // Cast response to HTTPURLResponse to get more properties from the response
                httpResponse = response as! HTTPURLResponse
                
                if httpResponse.statusCode == 413 {
                    print("Request body is too large, the server denied the request")
                    completion(httpResponse, responseJson)
                } else {
                    if httpResponse.statusCode != 200 && httpResponse.statusCode != 201 {
                        print("Request denied: \(httpResponse.statusCode)")
                        
                    } else {
                        print("Request succeeded")
                    }
                    
                    // Request went to server, so parse the response JSON
                    do {
                        // Deserialize the response body data into a JSON dictionary
                        responseJson = try JSONSerialization.jsonObject(with: data!, options: .allowFragments) as! [String: Any]
                    } catch let error as NSError {
                        // Catch errors trying to cast the response or deserialize the response body data
                        print(error)
                    }
                    
                    // Send the results to the caller
                    completion(httpResponse, responseJson)
                }
            }
        }
        
        task.resume()
    }
    
    private static func urlEncodedString(fromParams: [String: Any]) -> String {
        var paramsAndValues: [String] = []
        for (key, value) in fromParams {
            let paramAndValue: String = "\(key)=\(value)"
            paramsAndValues.append(paramAndValue)
        }
        
        return paramsAndValues.joined(separator: "&")
    }
}
