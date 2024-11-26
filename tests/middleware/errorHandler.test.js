const errorHandler = require('../../middleware/errorHandler');

describe('errorHandler Middleware', () => {
  it('sollte einen Fehler korrekt behandeln', () => {
    const err = new Error('Testfehler');
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Testfehler' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sollte die Standardfehlermeldung verwenden, wenn keine bereitgestellt wird', () => {
    const err = {};
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Interner Serverfehler' });
    expect(next).not.toHaveBeenCalled();
  });
});

