//
//  UserService.swift
//  Feasy
//
//  Created by Steven McCracken on 9/16/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import Foundation

class UserService {
    let http = FeasyApi()
    let username: String = "test"
    let password: String = "test"
    
    func login(resolve: @escaping (HTTPURLResponse, [String: Any]) -> Void) {
        let loginParams: [String: String] = ["username": self.username, "password": self.password]
        http.post(path: "/login", parameters: loginParams) { httpResponse, requestBodyJson in
            resolve(httpResponse, requestBodyJson)
        }
    }
}
