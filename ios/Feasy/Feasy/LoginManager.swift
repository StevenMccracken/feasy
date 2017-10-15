//
//  LoginManager.swift
//  Feasy
//
//  Created by Steven McCracken on 9/17/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import Foundation

/// Handles information for confidential user credentials
class LoginManager {
  
  private static var userIsLoggedIn: Bool = false
  
  static func getToken() -> String? {
    return StorageManager.get(key: "token") as? String
  }
  
  static func getUsername() -> String? {
    return StorageManager.get(key: "username") as? String
  }
  
  static func getPassword() -> String? {
    return StorageManager.get(key: "password") as? String
  }
  
  static func setToken(token: String) {
    StorageManager.set(key: "token", value: token)
  }
  
  static func setUsername(username: String) {
    StorageManager.set(key: "username", value: username)
  }
  
  static func setPassword(password: String) {
    StorageManager.set(key: "password", value: password)
  }
  
  static func removeToken() {
    StorageManager.delete(key: "token")
  }
  
  static func isUserLoggedIn() -> Bool {
    return self.userIsLoggedIn
  }
  
  static func logUserOut() {
    self.userIsLoggedIn = false
    self.removeToken()
  }
}
