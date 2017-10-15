//
//  LaunchViewController.swift
//  Feasy
//
//  Created by Steven McCracken on 9/14/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import UIKit

protocol LaunchViewControllerDelegate {
  func didCompleteLogin(userInformation: Any)
}

class LaunchViewController: UINavigationController {
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    LoginManager.setUsername(username: "test")
    LoginManager.setPassword(password: "test")
    
    if LoginManager.isUserLoggedIn() {
      print("ayy")
    } else {
      print("noo")
      UserService.getWelcomeMessage() { message in
        print(message)
      }
      
      let loginStoryboard = UIStoryboard(name: "LoginViewStoryboard", bundle: nil)
      let loginViewController = loginStoryboard.instantiateInitialViewController() as! LoginViewController
      
      loginViewController.navController = self
      loginViewController.delegate = self
      
      self.pushViewController(loginViewController, animated: true)
    }
  }
  
  override func didReceiveMemoryWarning() {
    super.didReceiveMemoryWarning()
    // Dispose of any resources that can be recreated.
  }
}

extension LaunchViewController: LaunchViewControllerDelegate {
  func didCompleteLogin(userInformation: Any) {
    print(userInformation)
  }
}
