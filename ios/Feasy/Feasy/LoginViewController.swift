//
//  LoginViewController.swift
//  Feasy
//
//  Created by Steven McCracken on 10/14/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import UIKit

class LoginViewController: UIViewController {

  @IBOutlet weak var welcomeLabel: UILabel!
  @IBOutlet weak var usernameField: UITextField!
  @IBOutlet weak var passwordField: UITextField!
  @IBOutlet weak var loginButton: UIButton!
  
  var navController: UINavigationController?
  var delegate: LaunchViewController?
  
  override func viewDidLoad() {
    super.viewDidLoad()

    // Do any additional setup after loading the view.
    self.updateLoginButton(withEnabledStatus: false)
    usernameField.delegate = self
    passwordField.delegate = self
}

  override func didReceiveMemoryWarning() {
    super.didReceiveMemoryWarning()
    // Dispose of any resources that can be recreated.
  }
    
  @IBAction func loginButtonPressed(_ sender: UIButton) {
    print("Logging in")
    
    navController?.popViewController(animated: true)
    dismiss(animated: true, completion: { () in
      self.delegate?.didCompleteLogin(userInformation: "wow")
    })
  }
  
  func updateLoginButton(withEnabledStatus enabled: Bool) {
    DispatchQueue.main.async {
      self.loginButton.isEnabled = enabled
      if enabled {
        self.loginButton.setTitleColor(.red, for: .normal)
      } else {
        self.loginButton.setTitleColor(.gray, for: .normal)
      }
    }
  }
  
    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
    }
    */

}

extension LoginViewController: UITextFieldDelegate {

  func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
    print("wow")
    self.updateLoginButton(withEnabledStatus: self.usernameField.text != "" && self.passwordField.text != "")
    return true
  }
}
