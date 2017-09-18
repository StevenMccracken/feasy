//
//  UserService.swift
//  Feasy
//
//  Created by Steven McCracken on 9/16/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import Foundation

class UserService {
  
  static func login(resolve: @escaping (HTTPURLResponse, [String: Any]) -> Void) {
    let username: String = LoginManager.getUsername() ?? ""
    let password: String = LoginManager.getPassword() ?? ""
    let loginParams = ["username": username, "password": password]
    FeasyApi.post(path: "/login", parameters: loginParams) { httpResponse, responseBodyJson in
      resolve(httpResponse, responseBodyJson)
    }
  }
  
  static func get(username: String, resolve: @escaping (HTTPURLResponse, [String: Any]) -> Void) {
    let getPath = "/users/\(username)"
    FeasyApi.get(path: getPath) { httpResponse, responseBodyJson in
      resolve(httpResponse, responseBodyJson)
    }
  }
}
